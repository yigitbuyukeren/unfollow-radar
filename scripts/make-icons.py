"""Basit, bağımlılıksız PNG ikon üretici: gradyan yuvarlak kare + iç içe iki halka."""
import math
import struct
import zlib

A, B = (109, 74, 255), (255, 79, 139)


def pixel(x, y, size):
    """(0..1) koordinatında RGBA döndürür."""
    r = 0.22
    dx = max(abs(x - 0.5) - (0.5 - r), 0)
    dy = max(abs(y - 0.5) - (0.5 - r), 0)
    if dx * dx + dy * dy > r * r:
        return (0, 0, 0, 0)
    t = (x + y) / 2
    col = tuple(a + (b - a) * t for a, b in zip(A, B))
    stroke = 0.055
    for cx in (0.40, 0.60):
        d = math.hypot(x - cx, y - 0.5)
        if abs(d - 0.17) < stroke / 2:
            return (255, 255, 255, 255)
    return (*col, 255)


def render(size, ss=4):
    rows = []
    for py in range(size):
        row = bytearray([0])
        for px in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(ss):
                for sx in range(ss):
                    r, g, b, a = pixel((px + (sx + .5) / ss) / size, (py + (sy + .5) / ss) / size, size)
                    acc[0] += r * a; acc[1] += g * a; acc[2] += b * a; acc[3] += a
            n = ss * ss
            a = acc[3] / n
            if acc[3]:
                row += bytes([round(acc[0] / acc[3]), round(acc[1] / acc[3]), round(acc[2] / acc[3]), round(a)])
            else:
                row += bytes(4)
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


for s in (16, 32, 48, 128):
    open(f"icons/icon{s}.png", "wb").write(render(s))
    print("icons/icon%d.png" % s)
