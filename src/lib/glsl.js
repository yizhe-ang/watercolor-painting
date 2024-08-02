export const noise3Fn = /* glsl */ `
//https://thebookofshaders.com/edit.php#11/iching-03.frag
vec3 random3(vec3 c) {
    float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
    vec3 r;
    r.z = fract(512.0*j);
    j *= .125;
    r.x = fract(512.0*j);
    j *= .125;
    r.y = fract(512.0*j);
    return r - 0.5;
}

const float F3 =  0.3333333;
const float G3 =  0.1666667;

float snoise(vec3 p) {

    vec3 s = floor(p + dot(p, vec3(F3)));
    vec3 x = p - s + dot(s, vec3(G3));

    vec3 e = step(vec3(0.0), x - x.yzx);
    vec3 i1 = e*(1.0 - e.zxy);
    vec3 i2 = 1.0 - e.zxy*(1.0 - e);

    vec3 x1 = x - i1 + G3;
    vec3 x2 = x - i2 + 2.0*G3;
    vec3 x3 = x - 1.0 + 3.0*G3;

    vec4 w, d;

    w.x = dot(x, x);
    w.y = dot(x1, x1);
    w.z = dot(x2, x2);
    w.w = dot(x3, x3);

    w = max(0.6 - w, 0.0);

    d.x = dot(random3(s), x);
    d.y = dot(random3(s + i1), x1);
    d.z = dot(random3(s + i2), x2);
    d.w = dot(random3(s + 1.0), x3);

    w *= w;
    w *= w;
    d *= w;

    return dot(d, vec4(52.0));
}

vec2 snoise2(vec3 p) {
  return vec2(snoise(p), snoise(p + vec3(12345.6789)));
}
`;

export const noise2Fn = /* glsl */ `
// Some useful functions
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

//
// Description : GLSL 2D simplex noise function
//      Author : Ian McEwan, Ashima Arts
//  Maintainer : ijm
//     Lastmod : 20110822 (ijm)
//     License :
//  Copyright (C) 2011 Ashima Arts. All rights reserved.
//  Distributed under the MIT License. See LICENSE file.
//  https://github.com/ashima/webgl-noise
//

// Copied from : https://thebookofshaders.com/edit.php#11/2d-snoise-clear.frag

float snoise(vec2 v) {

// Precompute values for skewed triangular grid
const vec4 C = vec4(0.211324865405187,
                    // (3.0-sqrt(3.0))/6.0
                    0.366025403784439,
                    // 0.5*(sqrt(3.0)-1.0)
                    -0.577350269189626,
                    // -1.0 + 2.0 * C.x
                    0.024390243902439);
                    // 1.0 / 41.0

// First corner (x0)
vec2 i  = floor(v + dot(v, C.yy));
vec2 x0 = v - i + dot(i, C.xx);

// Other two corners (x1, x2)
vec2 i1 = vec2(0.0);
i1 = (x0.x > x0.y)? vec2(1.0, 0.0):vec2(0.0, 1.0);
vec2 x1 = x0.xy + C.xx - i1;
vec2 x2 = x0.xy + C.zz;

// Do some permutations to avoid
// truncation effects in permutation
i = mod289(i);
vec3 p = permute(
        permute( i.y + vec3(0.0, i1.y, 1.0))
            + i.x + vec3(0.0, i1.x, 1.0 ));

vec3 m = max(0.5 - vec3(
                    dot(x0,x0),
                    dot(x1,x1),
                    dot(x2,x2)
                    ), 0.0);

m = m*m ;
m = m*m ;

// Gradients:
//  41 pts uniformly over a line, mapped onto a diamond
//  The ring size 17*17 = 289 is close to a multiple
//      of 41 (41*7 = 287)

vec3 x = 2.0 * fract(p * C.www) - 1.0;
vec3 h = abs(x) - 0.5;
vec3 ox = floor(x + 0.5);
vec3 a0 = x - ox;

// Normalise gradients implicitly by scaling m
// Approximation of: m *= inversesqrt(a0*a0 + h*h);
m *= 1.79284291400159 - 0.85373472095314 * (a0*a0+h*h);

// Compute final noise value at P
vec3 g = vec3(0.0);
g.x  = a0.x  * x0.x  + h.x  * x0.y;
g.yz = a0.yz * vec2(x1.x,x2.x) + h.yz * vec2(x1.y,x2.y);
return 130.0 * dot(m, g);
}

vec2 snoise2(vec2 v) {
return vec2(
snoise(v) - snoise(v + vec2(12.3, 23.4)),
snoise(v + vec2(34.5, 45.6)) - snoise(v + vec2(56.7, 67.8))
);

}
`;
