#pragma once

#include <bits/stdc++.h>
using namespace std;

/* #region 浮点数 */
#pragma region 浮点数
struct Decimal {
    static constexpr double eps = 1e-10;
    double x;

    Decimal(double p) : x{p} {}
    Decimal() : x{0} {}

    bool operator<(const Decimal &d) const { return (d.x - x > eps); }
    bool operator==(const Decimal &d) const { return fabs(x - d.x) < eps; }
    bool operator!=(const Decimal &d) const { return !this->operator==(d); }
    bool operator>(const Decimal &d) const { return (x - d.x > eps); }
    bool operator<=(const Decimal &d) const { return !(*this > d); }
    bool operator>=(const Decimal &d) const { return !(*this < d); }
    Decimal operator+(const Decimal &d) const { return {x + d.x}; }
    Decimal operator+=(const Decimal &d) {
        this->x += d.x;
        return *this;
    }
    Decimal operator-(const Decimal &d) const { return {x - d.x}; }
    Decimal operator-() const {
        Decimal v = *this;
        v.x = -v.x;
        return v;
    }
    Decimal operator-=(const Decimal &d) {
        this->x -= d.x;
        return *this;
    }
    Decimal operator*(const Decimal &d) const { return {x * d.x}; }
    Decimal operator*=(const Decimal &d) {
        this->x *= d.x;
        return *this;
    }
    Decimal operator/(const Decimal &d) const {
        return d == 0.0 ? 2e18 : x / d.x;
    }
    Decimal operator/=(const Decimal &d) {
        this->x = (d == 0.0 ? 2e18 : this->x / d.x);
        return *this;
    }
    Decimal sqrt() const { return std::sqrt(x); }
    Decimal sqr() const { return x * x; }
    Decimal operator^(const Decimal &expo) const { return std::pow(x, expo.x); }
    Decimal abs() const { return Decimal(fabs(x)); }
    Decimal cos() const { return std::cos(this->val()); }
    Decimal sin() const { return std::sin(this->val()); }
    Decimal tan() const { return std::tan(this->val()); }
    Decimal acos() const { return std::acos(this->val()); }
    Decimal asin() const { return std::asin(this->val()); }
    Decimal exp() const { return std::exp(this->val()); }
    friend ostream &operator<<(ostream &out, const Decimal &d) {
        return (out << d.x);
    }
    friend istream &operator>>(istream &in, Decimal &d) { return (in >> d.x); }
    int sign() const { return -eps < x && x < eps ? 0 : (x < 0 ? -1 : 1); }
    double val() const { return x; }
};
#pragma endregion
/* #endregion */

/* 二维几何 */
namespace Geo2D {

    /* #region 平面几何相交状态 */
    enum class STATUS {
        Parallel,
        OnSameLineOverlap,
        OnSameLineDisjoint,
        SameLine,
        IntersectionSeg,
        IntersectionLine
    };
    inline ostream &operator<<(ostream &out, const STATUS &s) {
        switch (s) {
        case STATUS::Parallel: out << "(Lines or Segs) Parallel"; break;
        case STATUS::OnSameLineDisjoint:
            out << "(Segs) On same line, disjoint";
            break;
        case STATUS::SameLine: out << "(Lines) Are same line."; break;
        case STATUS::IntersectionSeg: out << "(Segments) Intersect"; break;
        case STATUS::IntersectionLine: out << "(Lines) Intersect"; break;
        case STATUS::OnSameLineOverlap:
            out << "(Segs) Overlap on same line";
            break;
        default: break;
        }
        return out;
    }
    /* #endregion */

    /* #region 点、向量 */
#define Point Vector
    struct Vector {
        Decimal x, y;
        Vector() : x{0}, y{0} {}
        Vector(const Decimal &a, const Decimal &b) : x(a), y(b) {}
        // 运算符重载
        Vector operator+(const Vector &v) const {
            Vector tmp = *this;
            tmp.x += v.x, tmp.y += v.y;
            return tmp;
        }
        Vector operator+=(const Vector &v) {
            this->x += v.x, this->y += v.y;
            return *this;
        }
        Vector operator+(const Decimal &t) const {
            Vector a = *this;
            return a += t;
        }
        Vector operator+=(const Decimal &t) {
            this->x += t, this->y += t;
            return *this;
        }
        Vector operator-(const Vector &v) const {
            Vector tmp = *this;
            tmp.x -= v.x, tmp.y -= v.y;
            return tmp;
        }
        Vector operator-=(const Vector &v) {
            this->x -= v.x, this->y -= v.y;
            return *this;
        }
        Vector operator-=(const Decimal &t) {
            this->x -= t, this->y -= t;
            return *this;
        }
        Vector operator-(const Decimal &t) const {
            Vector a = *this;
            return a -= t;
        }
        Vector operator-() const {
            Vector a = *this;
            a.x = -a.x, a.y = -a.y;
            return a;
        }
        Vector operator*=(const Decimal &t) {
            this->x *= t, this->y *= t;
            return *this;
        }
        Vector operator*(const Decimal &t) const {
            Vector a = *this;
            return a *= t;
        }
        Vector operator/(const Decimal &d) const {
            Vector tmp = *this;
            tmp.x /= d, tmp.y /= d;
            return tmp;
        }
        Vector operator/=(const Decimal &d) {
            this->x /= d, this->y /= d;
            return *this;
        }
        bool operator>(const Vector &v) const {
            return x != v.x ? x > v.x : y > v.y;
        }
        bool operator>=(const Vector &v) const {
            return x != v.x ? x >= v.x : y >= v.y;
        }
        bool operator<(const Vector &v) const {
            return x != v.x ? x < v.x : y < v.y;
        }
        bool operator<=(const Vector &v) const {
            return x != v.x ? x <= v.x : y <= v.y;
        }
        bool operator==(const Vector &v) const { return x == v.x and y == v.y; }
        bool operator!=(const Vector &v) const {
            return not this->operator==(v);
        }
        friend ostream &operator<<(ostream &out, const Vector &a) {
            return (out << "(" << a.x << ", " << a.y << ")");
        }
        friend istream &operator>>(istream &in, Vector &a) {
            return (in >> a.x >> a.y);
        }

        // 模长
        Decimal Scale() const { return (x.sqr() + y.sqr()).sqrt(); }
        // 单位向量
        Vector Unit() const { return *this / this->Scale(); }

        // 点积
        Decimal dot(const Vector &v) const { return x * v.x + y * v.y; }
        // 叉积
        Decimal cross(const Vector &v) const { return x * v.y - y * v.x; }
        // 极角
        Decimal Angle() const { return atan2(y.val(), x.val()); }
        // 与 v 的夹角
        Decimal AngleBetween(const Vector &v) {
            return (dot(v) / Scale() / v.Scale()).acos();
        }
        // 点之间的距离
        Decimal Distance(const Point &p) const { return (*this - p).Scale(); }

        // 绕点旋转
        Point Rotate(const Point &O, const Decimal &ang) {
            return {O.x + (x - O.x) * ang.cos() - (y - O.y) * ang.sin(),
                    O.y + (y - O.y) * ang.cos() - (x - O.x) * ang.sin()};
        }
        // 关于点 p 的对称点
        Point SymmetricPoint(const Point &p) const { return p * 2 - *this; }
        // 投影到 v 上的投影向量
        Vector ProjectVector(const Vector &v) const {
            return v.Unit() * dot(v) / v.Scale();
        }
        // 关于 v 的对称向量
        Vector SymmetricVector(const Vector &v) const {
            return ProjectVector(v) * 2 - *this;
        }
    };
    /* #endregion */

    /* #region 线段、直线 */
#define Segment Line
    struct Line {
        Point s, e; // start, end
        Vector d;   // direction

        Line() = default;
        Line(const Point &b, const Vector &dir) : d{dir}, s{b}, e{b + dir} {}
        static Line from(const Point &s, const Point &e) {
            return Line{s, e - s};
        }
        friend ostream &operator<<(ostream &out, const Line &l) {
            return (out << setprecision(2) << fixed << "y = " << l.d.y / l.d.x
                        << "x + " << l.s.y - l.d.y / l.d.x * l.s.x);
        }
        // 极角
        Decimal angle() const { return d.Angle(); }
        // 斜率
        Decimal slope() const { return d.y / d.x; }
        // y 轴截距
        Decimal intercept() const { return s.y - d.y / d.x * s.x; }
        // 代入直线方程
        Decimal y(const Decimal &x) { return (s + d * (x - s.x) / d.x).y; }
        // 记录另外一个半平面（默认为向量的左手边）
        void reverse() { swap(s, e), d = -d; }
        // 点是否在直线上
        bool IsOnLine(const Point &P) const { return d.cross(P - s) == 0; }
        // 点是否在线段上
        bool IsOnSegment(const Point &P) const {
            return this->IsOnLine(P) and (P - s).dot(e - P) >= 0;
        }
        // 点是否落在半平面内
        bool IsInHalfPlane(const Point &P) const { return d.cross(P - s) > 0; }
        // 和另一条直线、线段的位置关系
        STATUS Relation(const Line &L, bool is_segment = false) const {
            if (!is_segment)
                return d.cross(L.d) != 0
                           ? STATUS::IntersectionLine
                           : (intercept() == L.intercept() ? STATUS::SameLine
                                                           : STATUS::Parallel);
            else {
                if (d.cross(L.d) == 0) {
                    if (intercept() != L.intercept()) return STATUS::Parallel;
                    else
                        return (IsOnSegment(L.s) or IsOnSegment(L.e)
                                    ? STATUS::OnSameLineOverlap
                                    : STATUS::OnSameLineDisjoint);
                } else {
                    // 快速排斥实验
                    bool ok1 = max(s.x, e.x) >= min(L.s.x, L.e.x) and
                               max(L.s.x, L.e.x) >= min(s.x, e.x) and
                               max(s.y, e.y) >= min(L.s.y, L.e.y);
                    // 跨立实验
                    bool ok2 = 1;
                    ok2 = ok2 and
                          (L.s - s).cross(e - s) * (e - s).cross(L.e - s) >= 0;
                    ok2 = ok2 and (s - L.s).cross(L.e - L.s) *
                                          (L.e - L.s).cross(e - L.s) >=
                                      0;

                    if (ok1 and ok2) return STATUS::IntersectionSeg;
                    else return STATUS::IntersectionLine;
                }
            }
        }
        // 点到直线距离
        Decimal DistanceOfPoint(const Point &P, bool directed = false) const {
            return directed ? d.cross(P - s) : d.cross(P - s).abs();
        }
        // 平行直线之间的距离
        Decimal DistanceBetweenLine(const Line &l) const {
            return PerpVector(l.s).Scale().abs();
        }
        // 点到直线的垂直向量
        Vector PerpVector(const Point &P) const {
            return (P - s) - (P - s).ProjectVector(d);
        }
        // 过定点作直线的垂线
        Line PerpLine(const Point &P) const {
            return Line{P, Vector{-d.y, d.x}};
        }
        // 作线段的中垂线
        Line PerpBisector() const { return PerpLine((s + e) / 2); }
        // 计算两条直线的交点
        Point IntersectPoint(const Line &l) const {
            Decimal t = (l.s - s).cross(l.d) / d.cross(l.d);
            return s + d * t;
        }
        // 返回两条直线的角平分线
        Line AngleBisector(const Line &l) const {
            Decimal angle = (this->d.Angle() + l.d.Angle()) / 2;
            Vector ndir{1, angle.tan()};
            Point p = IntersectPoint(l);
            return Line{p, ndir};
        }
    };
    /* #endregion */

    /* #region 平面图形 */
    struct Shape {};

    struct Polygon : Shape {
        vector<Point> _v;
        Point &operator[](const int &i) { return _v[i]; }
        void AddPoint(const Point &p) { _v.push_back(p); }
    };

    struct Circle : Shape {
        Point c;   // center
        Decimal r; // radius
        bool isInside(const Vector &p) const { return (p - c).Scale() <= r; }
        Point Coord(const Decimal &ang) const {
            return c + Point{r * ang.cos(), r * ang.sin()};
        }
    };

    struct Triangle : Shape {
        Point A, B, C;
    };
    /* #endregion */

    /* #region 半平面 */
    struct HalfPlane {
        vector<Line> ln, _q;
        Polygon _i;

        void AddVector(const Line &v) { ln.push_back(v); }
        bool Solve() {
            int n = ln.size();
            vector<Line> q(n + 5);
            vector<Point> p(n + 5);
            sort(ln.begin(), ln.end(), [&](Line &a, Line &b) {
                return a.angle() < b.angle();
            }); // 极角排序

            int h = 0, t = 0;
            q[0] = ln[0];
            for (int i = 1; i < n; i++) {
                while (h < t && !ln[i].IsInHalfPlane(p[t - 1])) t--;
                while (h < t && !ln[i].IsInHalfPlane(p[h])) h++;
                if (q[t].d.cross(ln[i].d) == 0)
                    q[t] = ln[i].IsInHalfPlane(q[t].s) ? q[t] : ln[i];
                else q[++t] = ln[i];
                if (h < t) p[t - 1] = q[t].IntersectPoint(q[t - 1]);
            }

            while (h < t && !q[h].IsInHalfPlane(p[t - 1])) t--;
            p[t] = q[t].IntersectPoint(q[h]);

            for (int i = h; i <= t; i++) _q.push_back(q[i]);

            if (t - h <= 1) return false;
            for (int i = h; i <= t; i++) _i.AddPoint(p[i]);
            return true;
        }
    };
    /* #endregion */
}; // namespace Geo2D

/* #region 三维计算几何 */
namespace Geo3D {
#define Point3D Vector3D
    struct Vector3D {};
}; // namespace Geo3D
/* #endregion */