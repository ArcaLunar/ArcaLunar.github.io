import torch
import math
import numpy as np


class SimpleDecoderLayer(torch.nn.Module):
    def __init__(self, hidden_dim, head_num, attn_dropout_rate=0.1):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.head_dim = hidden_dim // head_num
        self.head_num = head_num

        # Multihead attention
        self.qproj = torch.nn.Linear(hidden_dim, hidden_dim)
        self.wproj = torch.nn.Linear(hidden_dim, hidden_dim)
        self.vproj = torch.nn.Linear(hidden_dim, hidden_dim)
        self.oproj = torch.nn.Linear(hidden_dim, hidden_dim)
        self.attn_dropout = torch.nn.Dropout(attn_dropout_rate)
        ## layer norm
        self.attn_ln = torch.nn.LayerNorm(hidden_dim, eps=1e-8)

        # ffn (raise dimension -> reduce -> layer norm)
        self.up_proj = torch.nn.Linear(hidden_dim, hidden_dim * 4)  # swishGLU
        self.down_proj = torch.nn.Linear(hidden_dim * 4, hidden_dim)
        self.act_fn = torch.nn.GELU()
        self.ffn_dropout = torch.nn.Dropout(attn_dropout_rate)
        self.ffn_ln = torch.nn.LayerNorm(hidden_dim, eps=1e-8)

    def attention_layer(self, query, key, value, mask=None):
        key = key.transpose(2, 3)
        attn_w = torch.matmul(query, key) / math.sqrt(self.head_dim)
        if mask is not None:
            mask = mask.tril()
            attn_w = attn_w.masked_fill(mask == 0, -1e9)
        else:
            mask = torch.ones_like(attn_w).tril()
            attn_w = attn_w.masked_fill(mask == 0, -1e9)
        attn_w = torch.nn.functional.softmax(attn_w, dim=-1)
        attn_w = self.attn_dropout(attn_w) # (b, head_num, seq, head_dim)
        
        midout = torch.matmul(attn_w, value)
        
        midout = midout.transpose(1, 2).contiguous()
        batch, seq, _ = midout.size()
        midout = midout.view(batch, seq, -1)
        
        output = self.oproj(midout)
        
        return output
        

    def MHA_self(self, x, mask=None):
        # (b, s, h) -> (b, head, s, head_dim)
        batch, seq, _ = x.size()
        query = self.qproj(x).view(batch, seq, self.head_num, -1).transpose(1, 2)
        key = self.wproj(x).view(batch, seq, self.head_num, -1).transpose(1, 2)
        value = self.vproj(x).view(batch, seq, self.head_num, -1).transpose(1, 2)

        output = self.attention_layer(query, key, value, mask)

        # post norm
        x = self.attn_ln(x + output)
        return x

    def FFN(self, x):
        residual = x
        x = self.up_proj(x)
        x = self.act_fn(x)
        x = self.down_proj(x)
        # drop out
        x = self.ffn_dropout(x)
        # post layer norm
        x = self.ffn_ln(x + residual)
        return x

    def forward(self, x, mask=None):
        x = self.MHA_self(x, mask)
        x = self.FFN(x)
        return x
