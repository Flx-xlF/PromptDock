#!/usr/bin/env python3
import struct
import zlib
import math

def make_png(width, height, rgba_data):
    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)
    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    raw = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw.append(0) # filter type none
        raw.extend(rgba_data[y * row_bytes : (y + 1) * row_bytes])
    idat = chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def blend_pixel(bg, fg, alpha):
    # fg and bg are (r, g, b)
    a = max(0.0, min(1.0, alpha))
    return (
        int(bg[0] * (1 - a) + fg[0] * a),
        int(bg[1] * (1 - a) + fg[1] * a),
        int(bg[2] * (1 - a) + fg[2] * a),
        255
    )

def render_icon(size):
    buf = bytearray(size * size * 4)
    scale = size / 128.0
    corner_radius = 24.0 * scale
    pad = 5.0 * scale
    
    # Pre-render grid
    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Distance to rounded rect edges
            cx = max(pad + corner_radius, min(size - pad - corner_radius, x))
            cy = max(pad + corner_radius, min(size - pad - corner_radius, y))
            dist = math.hypot(x - cx, y - cy)
            
            inside = (x >= pad and x <= size - pad and y >= pad and y <= size - pad)
            
            if dist > corner_radius + 1.0 and not inside:
                # Fully transparent background
                buf[idx:idx+4] = [0, 0, 0, 0]
                continue
                
            # Base background color: subtle dark slate gradient (#1e2430 -> #11141a)
            t_grad = (y / size)
            bg_r = int(30 * (1 - t_grad) + 16 * t_grad)
            bg_g = int(36 * (1 - t_grad) + 19 * t_grad)
            bg_b = int(48 * (1 - t_grad) + 26 * t_grad)
            
            # Anti-aliasing at outer border
            alpha = 1.0
            if dist > corner_radius - 1.0:
                alpha = max(0.0, min(1.0, (corner_radius + 0.8 - dist) / 1.6))
            
            # Accent border detection (border width ~ 2.5 * scale)
            border_w = max(1.0, 2.8 * scale)
            border_dist = abs(dist - corner_radius)
            is_border = False
            if dist <= corner_radius and dist >= corner_radius - border_w:
                is_border = True
            elif inside and (x < pad + border_w or x > size - pad - border_w or y < pad + border_w or y > size - pad - border_w):
                is_border = True

            r, g, b = bg_r, bg_g, bg_b
            if is_border:
                # Electric blue border #3b82f6 -> #60a5fa
                r, g, b = 74, 158, 255

            # Render Prompt Symbol: '>' Chevron and '_' Cursor
            nx = (x / scale) # 0 to 128 space
            ny = (y / scale)
            
            # Chevron lines:
            # Segment 1: (32, 42) -> (56, 64)
            # Segment 2: (56, 64) -> (32, 86)
            line_w = 4.2
            
            # Distance to segment 1
            # parametric t
            dx1, dy1 = 24.0, 22.0
            len1_sq = dx1*dx1 + dy1*dy1
            t1 = max(0.0, min(1.0, ((nx - 32)*dx1 + (ny - 42)*dy1) / len1_sq))
            dist1 = math.hypot(nx - (32 + t1*dx1), ny - (42 + t1*dy1))

            # Distance to segment 2
            dx2, dy2 = -24.0, 22.0
            len2_sq = dx2*dx2 + dy2*dy2
            t2 = max(0.0, min(1.0, ((nx - 56)*dx2 + (ny - 64)*dy2) / len2_sq))
            dist2 = math.hypot(nx - (56 + t2*dx2), ny - (64 + t2*dy2))
            
            chevron_dist = min(dist1, dist2)
            if chevron_dist < line_w + 1.2:
                cov = max(0.0, min(1.0, (line_w + 0.8 - chevron_dist) / 1.6))
                r = int(r * (1 - cov) + 96 * cov)
                g = int(g * (1 - cov) + 165 * cov)
                b = int(b * (1 - cov) + 250 * cov)

            # Cursor line '_' at (62, 86) to (94, 86), width 4.0
            if 60 <= nx <= 96 and abs(ny - 86) < line_w + 0.8:
                cov = max(0.0, min(1.0, (line_w + 0.8 - abs(ny - 86)) / 1.6))
                r = int(r * (1 - cov) + 74 * cov)
                g = int(g * (1 - cov) + 158 * cov)
                b = int(b * (1 - cov) + 255 * cov)

            # AI Sparkle star centered at (82, 50)
            # 4-point star: |nx - 82|^0.5 + |ny - 50|^0.5 < radius^0.5
            sx = abs(nx - 82)
            sy = abs(ny - 48)
            sparkle_metric = math.sqrt(sx) + math.sqrt(sy)
            sparkle_r = math.sqrt(16.0) # size
            if sparkle_metric < sparkle_r:
                cov = max(0.0, min(1.0, (sparkle_r - sparkle_metric) * 1.5))
                r = int(r * (1 - cov) + 180 * cov)
                g = int(g * (1 - cov) + 220 * cov)
                b = int(b * (1 - cov) + 255 * cov)

            final_a = int(alpha * 255)
            buf[idx:idx+4] = [r, g, b, final_a]
            
    return make_png(size, size, buf)

def main():
    for sz in [16, 32, 48, 128]:
        png_data = render_icon(sz)
        filename = f"icons/icon-{sz}.png"
        with open(filename, "wb") as f:
            f.write(png_data)
        print(f"Generated {filename} ({len(png_data)} bytes)")

if __name__ == "__main__":
    main()
