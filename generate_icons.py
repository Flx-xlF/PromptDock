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

def dist_to_segment(px, py, x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    len_sq = dx * dx + dy * dy
    if len_sq == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / len_sq))
    return math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))

def render_icon(size):
    buf = bytearray(size * size * 4)
    scale = size / 128.0
    corner_radius = 24.0 * scale
    pad = 5.0 * scale
    
    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Distance to rounded rect edges
            cx = max(pad + corner_radius, min(size - pad - corner_radius, x))
            cy = max(pad + corner_radius, min(size - pad - corner_radius, y))
            dist = math.hypot(x - cx, y - cy)
            
            inside = (x >= pad and x <= size - pad and y >= pad and y <= size - pad)
            
            if dist > corner_radius + 1.0 and not inside:
                buf[idx:idx+4] = [0, 0, 0, 0]
                continue
                
            # Base background: Deep cosmic obsidian-violet gradient (#1f1432 -> #0d0818)
            t_grad = (y / size)
            bg_r = int(31 * (1 - t_grad) + 13 * t_grad)
            bg_g = int(20 * (1 - t_grad) + 8 * t_grad)
            bg_b = int(50 * (1 - t_grad) + 24 * t_grad)
            
            # Anti-aliasing at outer border
            alpha = 1.0
            if dist > corner_radius - 1.0:
                alpha = max(0.0, min(1.0, (corner_radius + 0.8 - dist) / 1.6))
            
            # Accent border detection: Vibrant Electric Violet -> Neon Fuchsia
            border_w = max(1.0, 2.8 * scale)
            is_border = False
            if dist <= corner_radius and dist >= corner_radius - border_w:
                is_border = True
            elif inside and (x < pad + border_w or x > size - pad - border_w or y < pad + border_w or y > size - pad - border_w):
                is_border = True

            r, g, b = bg_r, bg_g, bg_b
            if is_border:
                # Gradient: #a855f7 (168, 85, 247) to #ec4899 (236, 72, 153)
                tb = (x + y) / (2.0 * size)
                r = int(168 * (1 - tb) + 236 * tb)
                g = int(85 * (1 - tb) + 72 * tb)
                b = int(247 * (1 - tb) + 153 * tb)

            nx = (x / scale) # 0 to 128 space
            ny = (y / scale)
            
            line_w = 4.2
            
            # --- 1. CHEVRON 1 (Turn 1 / Left Chevron in Violet) ---
            # Segment 1a: (22, 42) -> (44, 64)
            # Segment 1b: (44, 64) -> (22, 86)
            d1a = dist_to_segment(nx, ny, 22.0, 42.0, 44.0, 64.0)
            d1b = dist_to_segment(nx, ny, 44.0, 64.0, 22.0, 86.0)
            chev1_dist = min(d1a, d1b)
            
            if chev1_dist < line_w + 1.2:
                cov = max(0.0, min(1.0, (line_w + 0.8 - chev1_dist) / 1.6))
                # Glowing Light Violet (#c084fc)
                r = int(r * (1 - cov) + 192 * cov)
                g = int(g * (1 - cov) + 132 * cov)
                b = int(b * (1 - cov) + 252 * cov)

            # --- 2. CHEVRON 2 (Turn 2 / Right Chevron in Fuchsia) ---
            # Segment 2a: (46, 42) -> (68, 64)
            # Segment 2b: (68, 64) -> (46, 86)
            d2a = dist_to_segment(nx, ny, 46.0, 42.0, 68.0, 64.0)
            d2b = dist_to_segment(nx, ny, 68.0, 64.0, 46.0, 86.0)
            chev2_dist = min(d2a, d2b)
            
            if chev2_dist < line_w + 1.2:
                cov = max(0.0, min(1.0, (line_w + 0.8 - chev2_dist) / 1.6))
                # Glowing Neon Fuchsia (#f472b6 -> #ec4899)
                r = int(r * (1 - cov) + 244 * cov)
                g = int(g * (1 - cov) + 114 * cov)
                b = int(b * (1 - cov) + 182 * cov)

            # --- 3. AI Sparkle Star centered at (90, 44) ---
            sx = abs(nx - 90)
            sy = abs(ny - 44)
            sparkle_metric = math.sqrt(sx) + math.sqrt(sy)
            sparkle_r = math.sqrt(15.0)
            if sparkle_metric < sparkle_r:
                cov = max(0.0, min(1.0, (sparkle_r - sparkle_metric) * 1.6))
                # White-pink glow
                r = int(r * (1 - cov) + 255 * cov)
                g = int(g * (1 - cov) + 240 * cov)
                b = int(b * (1 - cov) + 255 * cov)

            # --- 4. "v2" / Workflow Mark in Bottom Right ---
            # At small toolbar sizes (16x16), draw a bold cursor underline: (72, 86) -> (100, 86)
            # At medium/large sizes (>= 32), render a crisp '2' mark!
            if size <= 16:
                # Underline cursor
                if 72 <= nx <= 100 and abs(ny - 86) < line_w + 0.8:
                    cov = max(0.0, min(1.0, (line_w + 0.8 - abs(ny - 86)) / 1.6))
                    r = int(r * (1 - cov) + 244 * cov)
                    g = int(g * (1 - cov) + 114 * cov)
                    b = int(b * (1 - cov) + 182 * cov)
            else:
                # Draw digit '2'
                d_2_top = dist_to_segment(nx, ny, 77.0, 70.0, 95.0, 70.0)
                d_2_right = dist_to_segment(nx, ny, 95.0, 70.0, 95.0, 77.0)
                d_2_diag = dist_to_segment(nx, ny, 95.0, 77.0, 77.0, 88.0)
                d_2_bot = dist_to_segment(nx, ny, 76.0, 88.0, 98.0, 88.0)
                d_2 = min(d_2_top, d_2_right, d_2_diag, d_2_bot)
                
                w_2 = 3.6
                if d_2 < w_2 + 1.2:
                    cov = max(0.0, min(1.0, (w_2 + 0.8 - d_2) / 1.6))
                    # Vibrant neon pink-fuchsia
                    r = int(r * (1 - cov) + 244 * cov)
                    g = int(g * (1 - cov) + 114 * cov)
                    b = int(b * (1 - cov) + 182 * cov)

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
