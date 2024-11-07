import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from thop import profile
from torchsummary import summary


BATCH_SIZE = 2


class CustomSign(torch.nn.Module):
    def __init__(self):
        super(CustomSign, self).__init__()
        self.alpha = torch.nn.Parameter(torch.tensor(1.0))

    def forward(self, x):
        quanted_x = torch.sign(x)
        estimated_x = torch.tanh(self.alpha * x)
        return (quanted_x - estimated_x).detach() + estimated_x


class Depthwise(nn.Module):
    def __init__(self, channels, kernel_size, stride=1, padding=0):
        super(Depthwise, self).__init__()
        self.weight = nn.Parameter(torch.randn(channels, 1, *kernel_size))
        self.kernel_size = kernel_size
        self.channels = channels
        self.stride = stride
        self.padding = padding
        self.pad = nn.ZeroPad2d(padding)
        self.wq = CustomSign()
        self.xq = CustomSign()

    def forward(self, x):
        n, c, hin, win = x.size()
        d, c_g, k, j = self.weight.size()

        assert c_g == 1

        pad_x = self.pad(x)
        pad_x = pad_x.unfold(2, k, self.stride).unfold(3, j, self.stride)
        h_pad, w_pad = pad_x.size(2), pad_x.size(3)

        pad_x = pad_x.reshape(n, self.channels, -1, h_pad, w_pad, k, j)
        weight = self.weight.reshape(self.channels, -1, c_g, k, j)

        wsignx = torch.einsum("ngchwkj,gdckj->ngdhw", self.xq(pad_x), weight)
        xsignw = torch.einsum("ngchwkj,gdckj->ngdhw", pad_x, self.wq(weight))

        out = wsignx + xsignw
        out = out.reshape(n, d, out.size(3), out.size(4))
        return out


class Pointwise(torch.nn.Module):
    def __init__(
        self, in_channels, out_channels, kernel_size=(1, 1), stride=1, padding=0
    ):
        super(Pointwise, self).__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.stride = stride
        self.padding = padding
        # 初始化卷积核
        self.weight = nn.Parameter(torch.randn(out_channels, in_channels, *kernel_size))

        # weight quantizer
        self.wq = CustomSign()
        self.xq = CustomSign()

    def forward(self, x):
        # 获取输入的维度信息
        batch, channels, height, width = x.size()

        print(x.size(), self.weight.size())

        out_height = (
            height + 2 * self.padding - self.kernel_size[0]
        ) // self.stride + 1
        out_width = (width + 2 * self.padding - self.kernel_size[1]) // self.stride + 1

        print(out_height, out_width)

        # 使用unfold来准备卷积操作
        x_unfold = F.unfold(
            x, self.kernel_size, padding=self.padding, stride=self.stride
        ).transpose(1, 2)
        print(x_unfold.size())  # batch_size, in_ch*kh*kw, oh*ow

        w_unfold = F.unfold(
            self.weight, self.kernel_size, padding=self.padding, stride=self.stride
        ).transpose(0, 2)
        print(w_unfold.size())

        signxw = (
            torch.matmul(self.xq(x_unfold), w_unfold)
            .transpose(1, 2)
            .view(batch, self.out_channels, out_height, out_width)
        )
        signwx = (
            torch.matmul(x_unfold, self.wq(w_unfold))
            .transpose(1, 2)
            .view(batch, self.out_channels, out_height, out_width)
        )

        output = signxw + signwx

        print(output.size())

        return signxw + signwx


class ConvLayer(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super().__init__()
        self.conv = nn.Sequential(
            Depthwise(in_channels, kernel_size, stride, padding),
            Pointwise(in_channels, out_channels, (1, 1)),
        )

    def forward(self, x):
        return self.conv(x)


class Conv2dWrapper(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)

    def forward(self, x):
        return self.conv(x)

k = (128, 16, 16)
IMG = torch.randn(1, *k)

a = ConvLayer(k[0], 64, (3, 3))
b = Conv2dWrapper(k[0], 64, (3, 3))
# x = a(i)
# out = a(IMG)
# a.train()

# los = torch.nn.MSELoss()
# loss = los(out, torch.ones_like(out))
# loss.backward()

summary(a, k, batch_size=2)
summary(b, k, batch_size=2)

# print(x)
# print(x.size())


"""
import torch
import torch.nn as nn
import torch.nn.functional as F

class CustomConv2d(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, stride=1, padding=0):
        super(CustomConv2d, self).__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.kernel_size = kernel_size
        self.stride = stride
        self.padding = padding
        # 初始化卷积核
        self.weight = nn.Parameter(torch.randn(out_channels, in_channels, *kernel_size))

    def forward(self, x):
        # 获取输入的维度信息
        batch_size, channels, height, width = x.size()
        out_height = (height + 2 * self.padding - self.kernel_size[0]) // self.stride + 1
        out_width = (width + 2 * self.padding - self.kernel_size[1]) // self.stride + 1

        # 使用unfold来准备卷积操作
        x_unfold = F.unfold(x, self.kernel_size, padding=self.padding, stride=self.stride)
        x_unfold = x_unfold.view(batch_size, channels, -1, self.kernel_size[0], self.kernel_size[1])

        # 计算sign(a_i)*b_i 和 a_i*sign(b_i)
        sign_weight = torch.sign(self.weight)
        conv1 = torch.sum(x_unfold * sign_weight, dim=(3, 4))
        conv2 = torch.sum(x_unfold * self.weight, dim=(3, 4))

        # 将两个结果相加
        conv = conv1 + conv2

        # 调整输出的形状
        conv = conv.view(batch_size, self.out_channels, out_height, out_width)

        return conv

# 示例使用
in_channels = 1
out_channels = 1
kernel_size = (3, 3)
stride = 1
padding = 1

# 创建自定义卷积层
custom_conv = CustomConv2d(in_channels, out_channels, kernel_size, stride, padding)

# 创建一个随机输入
input_tensor = torch.randn(1, in_channels, 28, 28)

# 前向传播
output = custom_conv(input_tensor)

print("输出形状:", output.shape)
"""
