#pragma once

/**
 * @file oi_string.hpp
 * @author ArcaStellar
 * @brief 字符串算法。序列自动机
 * @version 0.1
 * @date 2024-11-06
 *
 * @copyright Copyright (c) 2024
 *
 */

#include "headers/oi_ds.hpp"
#include <bits/stdc++.h>
using namespace std;

namespace Automaton {
    /**
     * @brief 子序列自动机。适用于字符集大小较大的时候
     *
     */
    class SeqAutomaton {
        DS::PArray<int> nxt; // 跳转指针
        int CSize;

      public:
        /**
         * @brief 设置字符集大小 V，并初始化可持久化数组。
         * @details 指针跳转的结束条件：nxt[][] 为 -1。V 是字符集大小，建议设置为 max(N, V)+1
         * @param V 字符集大小
         */
        void SetCharset(int V) {
            vector<int> endcase(V, -1);
            nxt.Load(V, &endcase);
        }
        /**
         * @brief 给定数组/字符串，构建静态序列自动机
         * @details 指针由版本（对应字符位置）指向另一个版本（另一个字符位置）。
         最后一个字符的版本为 1，第一个字符的版本为 n。
         最初始版本 0 都是 (pos=-1)
         * @param v
         */
        void Construct(vector<int> &v) {
            for (int n = int(v.size()), i = n - 2; i >= -1; --i) {
                int ver = nxt.LastestVersion();
                nxt.ModifyAndSave(ver, v[i + 1], ver);
            }
        }
        /**
         * @brief 判断 pat 是否是原序列的一个子序列。
         */
        bool Match(vector<int> &pat) const {
            int ver = nxt.LastestVersion();
            int i = 0, L = pat.size();
            while (i < L) {
                ver = this->nxt.Ask(ver, pat[i]);
                if (ver == -1) break;
                i++;
            }
            return i == L;
        }
        int CountSubseq() const { int ret = 1; }
    };
}; // namespace Automaton