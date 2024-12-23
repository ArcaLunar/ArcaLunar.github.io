#pragma once

#include <bits/stdc++.h>
#include <tuple>
using namespace std;

#pragma region 通用浮点数
struct Decimal {
  static constexpr double eps = 1e-8;
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
  Decimal floor() const { return std::floor(this->x); }
  Decimal ceil() const { return std::ceil(this->x); }
  Decimal round() const { return std::round(this->x); }
  friend ostream &operator<<(ostream &out, const Decimal &d) {
    return (out << d.x);
  }
  friend istream &operator>>(istream &in, Decimal &d) { return (in >> d.x); }
  int sign() const { return -eps < x && x < eps ? 0 : (x < 0 ? -1 : 1); }
  double val() const { return x; }
  long long toll() const { return static_cast<long long>(this->x); }
};
const Decimal PI = numbers::pi;
#pragma endregion Float

#pragma region 二维计算几何
namespace Geo2D {

#pragma region 平面直线与线段位置情况
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
  case STATUS::Parallel:
    out << "(Lines or Segs) Parallel";
    break;
  case STATUS::OnSameLineDisjoint:
    out << "(Segs) On same line, disjoint";
    break;
  case STATUS::SameLine:
    out << "(Lines) Are same line.";
    break;
  case STATUS::IntersectionSeg:
    out << "(Segments) Intersect";
    break;
  case STATUS::IntersectionLine:
    out << "(Lines) Intersect";
    break;
  case STATUS::OnSameLineOverlap:
    out << "(Segs) Overlap on same line";
    break;
  default:
    break;
  }
  return out;
}
#pragma endregion

#pragma region 点和向量
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
  bool operator>(const Vector &v) const { return x != v.x ? x > v.x : y > v.y; }
  bool operator>=(const Vector &v) const {
    return x != v.x ? x >= v.x : y >= v.y;
  }
  bool operator<(const Vector &v) const { return x != v.x ? x < v.x : y < v.y; }
  bool operator<=(const Vector &v) const {
    return x != v.x ? x <= v.x : y <= v.y;
  }
  bool operator==(const Vector &v) const { return x == v.x and y == v.y; }
  bool operator!=(const Vector &v) const { return not this->operator==(v); }
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
  Point Rotate(const Decimal &ang, const Point &O = {0, 0}) {
    Decimal D = Distance(O);
    auto a = (*this - O).Angle() + ang;
    return O + Point{a.cos(), a.sin()} * D;
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
#pragma endregion

#pragma region 平面线段和直线
#define Segment Line
struct Line {
  Point s, e; // start, end
  Vector d;   // direction

  Line() = default;
  Line(const Point &b, const Vector &dir) : d{dir}, s{b}, e{b + dir} {}
  static Line from(const Point &s, const Point &e) { return Line{s, e - s}; }
  friend ostream &operator<<(ostream &out, const Line &l) {
    return (out << setprecision(2) << fixed << "y = " << l.d.y / l.d.x << "x + "
                << l.s.y - l.d.y / l.d.x * l.s.x);
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
        if (intercept() != L.intercept())
          return STATUS::Parallel;
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
        ok2 = ok2 and (L.s - s).cross(e - s) * (e - s).cross(L.e - s) >= 0;
        ok2 = ok2 and
              (s - L.s).cross(L.e - L.s) * (L.e - L.s).cross(e - L.s) >= 0;

        if (ok1 and ok2)
          return STATUS::IntersectionSeg;
        else
          return STATUS::IntersectionLine;
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
  Line PerpLine(const Point &P) const { return Line{P, Vector{-d.y, d.x}}; }
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
  // 点在直线上的投影
  Point ProjectOfPoint(const Point &p) const { return p + PerpVector(p); }
};
#pragma endregion

#pragma region 平面图形
struct Shape {};

#pragma region 多边形
struct Polygon : Shape {
  vector<Point> _v;
  Point &operator[](const int &i) { return _v[i]; }
  void AddPoint(const Point &p) { _v.push_back(p); }
  Decimal Area() const {
    Decimal ans = 0;
    for (int i = 0, n = int(_v.size()); i < n; i++)
      ans += _v[i].cross(_v[(i + 1) % n]) * 0.5;
    return ans;
  }
  // 给定点集，求凸包
  vector<Point> GetConvex(bool inplace = false) {
    sort(_v.begin(), _v.end());
    vector<Point> _stack;
    int top = -1;
    auto check = [&](const Point &p) {
      return (_stack[top] - _stack[top - 1]).cross(p - _stack[top]) <= 0;
    };
    for (int i = 0, n = _v.size(); i < n; i++) {
      while (top > 0 && check(_v[i]))
        top--, _stack.pop_back();
      _stack.push_back(_v[i]), top++;
    }
    int t = top;
    for (int n = _v.size(), i = n - 2; i >= 0; i--) {
      while (top > t && check(_v[i]))
        top--, _stack.pop_back();
      _stack.push_back(_v[i]), top++;
    }
    _stack.pop_back(), top--;
    if (inplace)
      swap(_v, _stack);
    return _stack;
  }
};
#pragma endregion

#pragma region 圆的相交情况
enum class CircleRelation {
  Containing,
  SameCircle,
  Inscribe,
  Circumscirbe, // 外切
  Intersect,    // 相交
  Apart         // 相离
};
#pragma endregion

#pragma region 圆
struct Circle : Shape {
  Point c;   // center
  Decimal r; // radius
  bool isInside(const Vector &p) const { return (p - c).Scale() <= r; }
  Point Coord(const Decimal &ang) const {
    return c + Point{r * ang.cos(), r * ang.sin()};
  }

  // 给定两圆，求内外公切线
  // tuple[0]: 切线在圆 A 上的切点
  // tuple[1]: 在 B 上的切点
  // tuple[3]: 两圆的相对位置关系
  static tuple<vector<Point>, vector<Point>, CircleRelation>
  Tangent(Circle &A, Circle &B) {
    vector<Point> a, b;
    if (A.r < B.r)
      swap(A, B), swap(a, b);

    Decimal dist = A.c.Distance(B.c);
    Decimal rdif = A.r - B.r;

    if (dist < rdif) { // 内含
      return make_tuple(a, b, CircleRelation::Containing);
    }

    Decimal base = (B.c - A.c).Angle();
    if (dist == 0 && A.r == B.r) { // 重合
      return make_tuple(a, b, CircleRelation::SameCircle);
    }

    if (dist == rdif) { // 内切
      a.push_back(A.Coord(base));
      b.push_back(B.Coord(base));
      return make_tuple(a, b, CircleRelation::Inscribe);
    }

    CircleRelation verdict;
    // 外公切线
    Decimal rsum = A.r + B.r;
    Decimal ang = (rdif / dist).acos();
    a.push_back(A.Coord(base + ang));
    b.push_back(B.Coord(base + ang));
    a.push_back(A.Coord(base - ang));
    b.push_back(B.Coord(base - ang));

    if (dist == rsum) { // 外切
      a.push_back(A.Coord(base));
      b.push_back(B.Coord(base + numbers::pi));
      verdict = CircleRelation::Circumscirbe;
    } else if (dist > rsum) { // 相离
      Decimal ang1 = (rsum / dist).acos();
      a.push_back(A.Coord(base + ang1));
      b.push_back(B.Coord(base + ang1 + numbers::pi));
      a.push_back(A.Coord(base - ang1));
      b.push_back(B.Coord(base - ang1 + numbers::pi));
      verdict = CircleRelation::Apart;
    }

    return make_tuple(a, b, verdict);
  }
  // 给定三个点，求外接圆
  static Circle BoundCircle(const Point &a, const Point &b, const Point &c) {
    auto [a1, b1] = b - a;
    auto [a2, b2] = c - a;
    Decimal c1 = b.Scale().sqr() - a.Scale().sqr();
    Decimal c2 = c.Scale().sqr() - a.Scale().sqr();
    Circle ret;
    ret.c = {(b2 * c1 - b1 * c2) / (b2 * a1 * 2 - b1 * a2 * 2),
             (a2 * c1 - a1 * c2) / (a2 * b1 * 2 - a1 * b2 * 2)};
    ret.r = (ret.c - a).Scale();
    return ret;
  }
  // 随机化求最小圆覆盖，期望时间复杂度线性
  static Circle MinEnclosingCircle(vector<Point> &v) {
    std::mt19937_64 rng(time(0));
    shuffle(v.begin(), v.end(), rng);
    int n = v.size();
    Circle ans;
    ans.c = v[0], ans.r = 0;
    for (int i = 1; i < n; i++) {
      if (ans.isInside(v[i]))
        continue;
      ans.c = v[i], ans.r = 0;
      for (int j = 0; j < i; j++) {
        if (ans.isInside(v[j]))
          continue;
        ans.c = (v[i] + v[j]) / 2;
        ans.r = (ans.c - v[j]).Scale();
        for (int k = 0; k < j; k++) {
          if (ans.isInside(v[k]))
            continue;
          ans = BoundCircle(v[i], v[j], v[k]);
        }
      }
    }

    return ans;
  }
};
#pragma endregion

#pragma region 三角形
struct Triangle : Shape {
  Point A, B, C;
};
#pragma endregion
#pragma endregion

#pragma region 半平面交
struct HalfPlane {
  vector<Line> ln, _q;
  Polygon _i;

  void AddVector(const Line &v) { ln.push_back(v); }
  bool Solve() {
    int n = ln.size();
    vector<Line> q(n + 5);
    vector<Point> p(n + 5);
    sort(ln.begin(), ln.end(),
         [&](Line &a, Line &b) { return a.angle() < b.angle(); }); // 极角排序

    int h = 0, t = 0;
    q[0] = ln[0];
    for (int i = 1; i < n; i++) {
      while (h < t && !ln[i].IsInHalfPlane(p[t - 1]))
        t--;
      while (h < t && !ln[i].IsInHalfPlane(p[h]))
        h++;
      if (q[t].d.cross(ln[i].d) == 0)
        q[t] = ln[i].IsInHalfPlane(q[t].s) ? q[t] : ln[i];
      else
        q[++t] = ln[i];
      if (h < t)
        p[t - 1] = q[t].IntersectPoint(q[t - 1]);
    }

    while (h < t && !q[h].IsInHalfPlane(p[t - 1]))
      t--;
    p[t] = q[t].IntersectPoint(q[h]);

    for (int i = h; i <= t; i++)
      _q.push_back(q[i]);

    if (t - h <= 1)
      return false;
    for (int i = h; i <= t; i++)
      _i.AddPoint(p[i]);
    return true;
  }
};
#pragma endregion

#pragma region 平面最近点对
struct Misc {
  // 线性对数时间找出平面最近点对，确定性算法；可动态加点
  // 返回：最近点对、其距离
  static tuple<Point, Point, Decimal> NearestPair_Deter(vector<Point> &p) {
    struct Sorter {
      bool operator()(const Point &a, const Point &b) const {
        return a.y < b.y;
      }
    };
    Decimal D = 1e18;
    Point a, b;

    multiset<Point, Sorter> q;
    sort(p.begin(), p.end());
    for (int n = int(p.size()), l = 0, r = 0; r < n; ++r) {
      while (l < r && p[r].x - p[l].x >= D)
        q.erase(q.find(p[l++]));
      auto it = q.lower_bound({p[r].x, p[r].y - D});
      for (; it != q.end() && (p[r].y - it->y).abs() < D; it++) {
        if (D > p[r].Distance(*it)) {
          D = p[r].Distance(*it);
          a = p[r], b = *it;
        }
      }
      q.insert(p[r]);
    }
    return make_tuple(a, b, D);
  }
};
#pragma endregion

#pragma region 反演变换
struct Inverse {
  // 圆形反演为圆形
  // o: 反演中心，r: 反演半径，a: 原来的圆
  static Circle invC2C(Point &o, Decimal &&r, Circle &a) {
    Decimal OA = o.Distance(a.c);
    Decimal RB =
        r.sqr() * 0.5 * (Decimal(1) / (OA - a.r) - Decimal(1) / (OA + a.r));
    Decimal OB = OA * RB / a.r;
    Circle c;
    c.r = RB, c.c.x = o.x + (a.c.x - o.x) * OB / OA;
    c.c.y = o.y + (a.c.y - o.y) * OB / OA;
    return c;
  }
  // 直线反演为圆形
  static Circle invL2C(Point &O, Decimal &R, Line &&l) {
    Point p = l.ProjectOfPoint(O);
    Decimal d = O.Distance(p);
    Decimal RB = R.sqr() / (d * 2);
    Vector VB = (p - O) / d * RB;
    Circle c;
    c.c = O + VB, c.r = RB;
    return c;
  }
};
#pragma endregion
}; // namespace Geo2D
#pragma endregion