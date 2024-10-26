import torch
import numpy as np


class CustomSign(torch.nn.Module):
    def __init__(self):
        super(CustomSign, self).__init__()
        self.alpha = torch.nn.Parameter(torch.tensor(1.0))

    def forward(self, x):
        quanted_x = torch.sign(x)
        estimated_x = torch.tanh(self.alpha * x)
        return (quanted_x - estimated_x).detach() + estimated_x


class MFDSConv(torch.nn.Module):
    def __init__(self, ch_in, ch_out):
        super(MFDSConv, self).__init__()

    def forward(self, x):
        pass
