// test some performance parts
// some discoveries:
// wasm as microoptimization is slower than JS
// 1-off SIMD like mat3 mult is slower than
import t from 'tst'
import watr from 'watr'

const f64pow = `(func $f64pow (param f64 f64)(result f64)(local f64 i64 i64 i64 f64 f64 f64 f64 f64 f64)(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 1)(f64.const 0x0p+0)))(local.set 3(i64.const 0))(block(br_if 0(i64.gt_s(i64.reinterpret_f64(local.get 0))(i64.const -1)))(br_if 0(f64.ne(f64.nearest(local.get 1))(local.get 1)))(local.set 3(i64.shl(i64.extend_i32_u(f64.ne(f64.nearest(local.tee 2(f64.mul(local.get 1)(f64.const 0x1p-1))))(local.get 2)))(i64.const 63)))(local.set 0(f64.neg(local.get 0))))(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 0)(f64.const 0x1p+0)))(block(br_if 0(f64.ne(local.get 0)(f64.const 0x0p+0)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 0))(f64.const inf)))(local.set 2(select(f64.const 0x0p+0)(f64.const inf)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(i64.ge_s(local.tee 4(i64.reinterpret_f64(local.get 0)))(i64.const 0)))(local.set 2(f64.const nan))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 1))(f64.const inf)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i32.eq(i32.wrap_i64(i64.shr_u(i64.reinterpret_f64(local.get 1))(i64.const 63)))(f64.lt(local.get 0)(f64.const 0x1p+0)))))(br 1))(block(br_if 0(i64.gt_u(local.get 4)(i64.const 4503599627370495)))(local.set 4(i64.sub(i64.shl(local.get 4)(local.tee 5(i64.add(i64.clz(local.get 4))(i64.const -11))))(i64.shl(local.get 5)(i64.const 52)))))(local.set 2(f64.const inf))(br_if 0(f64.gt(local.tee 1(f64.add(local.tee 10(f64.mul(local.tee 6(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 1))(i64.const -4294967296))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 7(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(local.tee 11(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 9(f64.div(local.tee 7(f64.add(f64.reinterpret_i64(i64.sub(local.get 4)(i64.and(local.tee 5(i64.add(local.get 4)(i64.const -4604544271217802189)))(i64.const -4503599627370496))))(f64.const -0x1p+0)))(local.tee 8(f64.add(local.get 7)(f64.const 0x1p+1))))))(i64.const -134217728))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 10(f64.mul(local.get 0)(local.get 0)))(local.tee 8(f64.add(f64.mul(local.tee 7(f64.div(f64.sub(f64.sub(local.get 7)(f64.mul(local.get 0)(local.tee 11(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 8))(i64.const -4294967296))))))(f64.mul(local.get 0)(f64.add(local.get 7)(f64.sub(f64.const 0x1p+1)(local.get 11)))))(local.get 8)))(f64.add(local.get 9)(local.get 0)))(f64.mul(f64.mul(local.tee 0(f64.mul(local.get 9)(local.get 9)))(local.get 0))(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(local.get 0)(f64.const 0x1.91a4911cbce5ap-3))(f64.const 0x1.97a897f8e6cap-3))(local.get 0))(f64.const 0x1.d8a9d6a7940bp-3))(local.get 0))(f64.const 0x1.1745bc213e72fp-2))(local.get 0))(f64.const 0x1.5555557cccac1p-2))(local.get 0))(f64.const 0x1.b6db6db6b8d5fp-2))(local.get 0))(f64.const 0x1.3333333333385p-1))))))(f64.const 0x1.8p+1)))(i64.const -67108864))))))(local.tee 9(f64.add(f64.mul(local.get 7)(local.get 0))(f64.mul(local.get 9)(f64.add(local.get 8)(f64.add(local.get 10)(f64.sub(f64.const 0x1.8p+1)(local.get 0)))))))))(i64.const -4294967296))))(f64.const 0x1.ec709dc4p-1)))(local.tee 9(f64.add(f64.mul(local.get 0)(f64.const -0x1.7f00a2d80faabp-35))(f64.mul(f64.add(local.get 9)(f64.sub(local.get 11)(local.get 0)))(f64.const 0x1.ec709dc3a03fdp-1)))))(local.tee 8(f64.convert_i64_s(i64.shr_s(local.get 5)(i64.const 52))))))(i64.const -2097152))))))(local.tee 0(f64.add(f64.mul(f64.sub(local.get 1)(local.get 6))(local.get 0))(f64.mul(f64.add(local.get 9)(f64.add(local.get 7)(f64.sub(local.get 8)(local.get 0))))(local.get 1))))))(f64.const 0x1p+10)))(local.set 9(f64.sub(local.get 1)(local.get 10)))(block(br_if 0(f64.ne(local.get 1)(f64.const 0x1p+10)))(br_if 1(f64.lt(local.get 9)(local.get 0))))(local.set 2(f64.const 0x0p+0))(br_if 0(f64.lt(local.get 1)(f64.const -0x1.0ccp+10)))(block(br_if 0(f64.ne(local.get 1)(f64.const -0x1.0ccp+10)))(br_if 1(f64.gt(local.get 9)(local.get 0))))(local.set 4(i64.reinterpret_f64(f64.add(f64.add(local.tee 8(f64.mul(local.tee 7(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 2(f64.sub(local.get 1)(local.tee 9(f64.nearest(local.get 1))))))(i64.const -4294967296))))(f64.const 0x1.62e42ffp-1)))(f64.add(local.tee 2(f64.add(f64.mul(local.get 2)(f64.const -0x1.718432a1b0e26p-35))(f64.mul(f64.add(local.get 0)(f64.sub(local.get 10)(f64.add(local.get 9)(local.get 7))))(f64.const 0x1.62e42ffp-1))))(f64.div(f64.mul(local.tee 0(f64.add(local.get 8)(local.get 2)))(local.tee 2(f64.sub(local.get 0)(f64.mul(local.tee 2(f64.mul(local.get 0)(local.get 0)))(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.const 0x1.63f2a09c94b4cp-25))(f64.const -0x1.bbd53273e8fb7p-20)))(f64.const 0x1.1566ab5c2ba0dp-14)))(f64.const -0x1.6c16c16c0ac3cp-9)))(f64.const 0x1.5555555555553p-3))))))(f64.sub(f64.const 0x1p+1)(local.get 2)))))(f64.const 0x1p+0))))(block(block(br_if 0(i32.eqz(f64.lt(f64.abs(local.get 9))(f64.const 0x1p+63))))(local.set 5(i64.trunc_f64_s(local.get 9)))(br 1))(local.set 5(i64.const -9223372036854775808)))(local.set 2(select(f64.mul(f64.reinterpret_i64(i64.add(local.tee 4(i64.add(i64.shl(local.get 5)(i64.const 52))(local.get 4)))(i64.const 4593671619917905920)))(f64.const 0x1p-1020))(f64.reinterpret_i64(local.get 4))(f64.lt(local.get 1)(f64.const -0x1.fep+9)))))(local.set 2(f64.reinterpret_i64(i64.or(local.get 3)(i64.reinterpret_f64(local.get 2))))))(local.get 2))`

const mat3mul = `
(memory 1)

;; xyz2lrgb matrix
(data (i32.const 0)
  "\\00\\00\\40\\40"  ;; 3.240969941904521
  "\\00\\00\\c4\\bf"  ;; -1.537383177570093
  "\\00\\00\\00\\bf"  ;; -0.498610760293
  "\\00\\00\\78\\bf"  ;; -0.96924363628087
  "\\00\\00\\f0\\3f"  ;; 1.87596750150772
  "\\00\\00\\aa\\3d"  ;; 0.041555057407175
  "\\00\\00\\e4\\3d"  ;; 0.055630079696993
  "\\00\\00\\50\\bf"  ;; -0.20397695888897
  "\\00\\00\\87\\3f"  ;; 1.056971514242878
)

;; Define the SIMD mat3 × vec3 function
(func $xyz2lrgb3_simd (export "xyz2lrgb3_simd")
  (param $r f32)  ;; Red component
  (param $g f32)  ;; Green component
  (param $b f32)  ;; Blue component
  (result f32) (result f32) (result f32)  ;; Return x, y, z as separate f32 values

  (local $x f32) (local $y f32) (local $z f32)  ;; XYZ components
  (local $r_simd v128) (local $g_simd v128) (local $b_simd v128)  ;; SIMD registers for r, g, b
  (local $m0 v128) (local $m1 v128) (local $m2 v128)  ;; Matrix rows

  ;; Load matrix coefficients from data section
  (local.set $m0 (v128.load (i32.const 0)))   ;; Load row 0
  (local.set $m1 (v128.load (i32.const 16)))  ;; Load row 1
  (local.set $m2 (v128.load (i32.const 32)))  ;; Load row 2

  ;; Splat r, g, b into SIMD registers
  (local.set $r_simd (f32x4.splat (local.get $r)))
  (local.set $g_simd (f32x4.splat (local.get $g)))
  (local.set $b_simd (f32x4.splat (local.get $b)))

  ;; Compute x = r * m0 + g * m1 + b * m2
  (local.set $x
    (f32x4.extract_lane 0
      (f32x4.add
        (f32x4.mul (local.get $r_simd) (v128.load (i32.const 0)))
        (f32x4.add
          (f32x4.mul (local.get $g_simd) (v128.load (i32.const 4)))
          (f32x4.mul (local.get $b_simd) (v128.load (i32.const 8)))))))

  ;; Compute y = r * m3 + g * m4 + b * m5
  (local.set $y
    (f32x4.extract_lane 0
      (f32x4.add
        (f32x4.mul (local.get $r_simd) (v128.load (i32.const 12)))
        (f32x4.add
          (f32x4.mul (local.get $g_simd) (v128.load (i32.const 16)))
          (f32x4.mul (local.get $b_simd) (v128.load (i32.const 20)))))))

  ;; Compute z = r * m6 + g * m7 + b * m8
  (local.set $z
    (f32x4.extract_lane 0
      (f32x4.add
        (f32x4.mul (local.get $r_simd) (v128.load (i32.const 24)))
        (f32x4.add
          (f32x4.mul (local.get $g_simd) (v128.load (i32.const 28)))
          (f32x4.mul (local.get $b_simd) (v128.load (i32.const 32)))))))

  ;; Return x, y, z as separate f32 values
  (return (local.get $x) (local.get $y) (local.get $z))
)
`


t.only('tuple vs args', () => {
  const xyz2lrgb3 = (x, y, z) => [
    (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293),
    (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175),
    (x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878)
  ]
  const lrgb2rgb3 = (r, g, b) => [
    r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92,
    g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92,
    b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92,
  ]

  const xyz2lrgb = ([x, y, z]) => [
    (x * 3.240969941904521) + (y * -1.537383177570093) + (z * -0.498610760293),
    (x * -0.96924363628087) + (y * 1.87596750150772) + (z * 0.041555057407175),
    (x * 0.055630079696993) + (y * -0.20397695888897) + (z * 1.056971514242878)
  ]
  const lrgb2rgb = ([r, g, b]) => [
    r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92,
    g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92,
    b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92,
  ]

  function applyMatrix([r, g, b], matrix) {
    return [
      r * matrix[0] + g * matrix[1] + b * matrix[2],
      r * matrix[3] + g * matrix[4] + b * matrix[5],
      r * matrix[6] + g * matrix[7] + b * matrix[8],
    ];
  }
  const mat = [
    3.240969941904521, -1.537383177570093, -0.498610760293,
    -0.96924363628087, 1.87596750150772, 0.041555057407175,
    0.055630079696993, -0.20397695888897, 1.056971514242878
  ]
  const xyz2lrgbmat = (xyz) => applyMatrix(xyz, mat)

  // wasm code
  const buf = watr(`
    (module
      ;; Import Math.pow function
      ;; (import "js" "f64pow" (func $f64pow (param f64 f64) (result f64)))

      ${f64pow}

      ${mat3mul}

      (func $xyz2lrgb3 (export "xyz2lrgb3wasm") (param $x f64) (param $y f64) (param $z f64)
        (result f64 f64 f64)
        ;; Calculate first component
        (f64.add
          (f64.add
            (f64.mul (local.get $x) (f64.const 3.240969941904521))
            (f64.mul (local.get $y) (f64.const -1.537383177570093))
          )
          (f64.mul (local.get $z) (f64.const -0.498610760293))
        )
        ;; Calculate second component
        (f64.add
          (f64.add
            (f64.mul (local.get $x) (f64.const -0.96924363628087))
            (f64.mul (local.get $y) (f64.const 1.87596750150772))
          )
          (f64.mul (local.get $z) (f64.const 0.041555057407175))
        )
        ;; Calculate third component
        (f64.add
          (f64.add
            (f64.mul (local.get $x) (f64.const 0.055630079696993))
            (f64.mul (local.get $y) (f64.const -0.20397695888897))
          )
          (f64.mul (local.get $z) (f64.const 1.056971514242878))
        )
      )

      (func $lrgb2rgb3 (export "lrgb2rgb3wasm") (param $r f64) (param $g f64) (param $b f64)
        (result f64 f64 f64)
        ;; Process R component
        (local.get $r)
        (f64.const 0.0031308)
        (f64.gt)
        (if (result f64)
          (then
            (f64.sub
              (f64.mul
                (f64.const 1.055)
                (call $f64pow
                  (local.get $r)
                  (f64.const 0.4166666666666667) ;; 1/2.4
                )
              )
              (f64.const 0.055)
            )
          )
          (else
            (f64.mul (local.get $r) (f64.const 12.92))
          )
        )
        ;; Process G component
        (local.get $g)
        (f64.const 0.0031308)
        (f64.gt)
        (if (result f64)
          (then
            (f64.sub
              (f64.mul
                (f64.const 1.055)
                (call $f64pow
                  (local.get $g)
                  (f64.const 0.4166666666666667)
                )
              )
              (f64.const 0.055)
            )
          )
          (else
            (f64.mul (local.get $g) (f64.const 12.92))
          )
        )
        ;; Process B component
        (local.get $b)
        (f64.const 0.0031308)
        (f64.gt)
        (if (result f64)
          (then
            (f64.sub
              (f64.mul
                (f64.const 1.055)
                (call $f64pow
                  (local.get $b)
                  (f64.const 0.4166666666666667)
                )
              )
              (f64.const 0.055)
            )
          )
          (else
            (f64.mul (local.get $b) (f64.const 12.92))
          )
        )
      )

      ;; joined conversion
      (func $xyz2rgb3 (export "xyz2rgb3wasm") (param f64 f64 f64) (result f64 f64 f64) (call $xyz2lrgb3 (local.get 0) (local.get 1) (local.get 2)) (call $lrgb2rgb3 ))

      ;; Define a function to simulate the loop
      (func $fullWasm (export "fullWasm") (param $N f64)
        (local $i f64)

        ;; Initialize i to 0
        (local.set $i (f64.const 0))

        ;; Start the loop
        (loop $loop
          ;; Check if i < N
          (if (f64.lt (local.get $i) (local.get $N))
            (then
              ;; Call xyz2rgb3wasm with i/N, i/N, 1 - i/N
              (call $xyz2rgb3
                (f64.div (local.get $i) (local.get $N))
                (f64.div (local.get $i) (local.get $N))
                (f64.sub (f64.const 1) (f64.div (local.get $i) (local.get $N)))
              )

              ;; Increment i
              (local.set $i (f64.add (local.get $i) (f64.const 1)))

              ;; Continue the loop
              (br $loop)
            )
          )
        )
      )
    )
  `)

  const mod = new WebAssembly.Module(buf)
  const { exports: { xyz2lrgb3wasm, lrgb2rgb3wasm, xyz2rgb3wasm, xyz2lrgb3_simd, fullWasm } } = new WebAssembly.Instance(mod, { js: { f64pow: Math.pow } })

  const N = 1e6

  console.log(
    lrgb2rgb3(...xyz2lrgb3(100 / N, 100 / N, 1 - 100 / N)),
    lrgb2rgb3wasm(...xyz2lrgb3wasm(100 / N, 100 / N, 1 - 100 / N)),
    xyz2rgb3wasm(100 / N, 100 / N, 1 - 100 / N),
    lrgb2rgb(xyz2lrgbmat([100 / N, 100 / N, 1 - 100 / N])),
    lrgb2rgb(xyz2lrgb3_simd(100 / N, 100 / N, 1 - 100 / N)),
  )

  console.time('tuple')
  for (let i = 0; i < N; i++) lrgb2rgb(xyz2lrgb([i / N, i / N, 1 - i / N]))
  console.timeEnd('tuple')

  console.time('args spread')
  for (let i = 0; i < N; i++) lrgb2rgb3(...xyz2lrgb3(i / N, i / N, 1 - i / N))
  console.timeEnd('args spread')

  console.time('args flat')
  for (let i = 0, abc; i < N; i++) abc = xyz2lrgb3(i / N, i / N, 1 - i / N), lrgb2rgb3(abc[0], abc[1], abc[2])
  console.timeEnd('args flat')

  console.time('args destruct')
  for (let i = 0, a, b, c; i < N; i++) [a, b, c] = xyz2lrgb3(i / N, i / N, 1 - i / N), lrgb2rgb3(a, b, c)
  console.timeEnd('args destruct')

  console.time('args matrix')
  for (let i = 0; i < N; i++)  lrgb2rgb(xyz2lrgbmat([i / N, i / N, 1 - i / N]))
  console.timeEnd('args matrix')

  console.time('args matrix wasm')
  for (let i = 0; i < N; i++)  lrgb2rgb(xyz2lrgb3_simd(i / N, i / N, 1 - i / N))
  console.timeEnd('args matrix wasm')


  console.time('args wasm')
  for (let i = 0, abc; i < N; i++) abc = xyz2lrgb3wasm(i / N, i / N, 1 - i / N), lrgb2rgb3wasm(abc[0], abc[1], abc[2])
  console.timeEnd('args wasm')

  console.time('args half wasm')
  for (let i = 0, abc; i < N; i++) abc = xyz2lrgb3wasm(i / N, i / N, 1 - i / N), lrgb2rgb3(abc[0], abc[1], abc[2])
  console.timeEnd('args half wasm')

  console.time('args joined wasm')
  for (let i = 0; i < N; i++) xyz2rgb3wasm(i / N, i / N, 1 - i / N)
  console.timeEnd('args joined wasm')

  console.time('args full wasm test')
  fullWasm(N)
  console.timeEnd('args full wasm test')

  console.time('tuple')
  for (let i = 0; i < N; i++) lrgb2rgb(xyz2lrgb([i / N, i / N, 1 - i / N]))
  console.timeEnd('tuple')
})
