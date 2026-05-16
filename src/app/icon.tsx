import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #15803d, #0f5c2e)',
          borderRadius: '7px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M4 6C4 4.5 5 3 6.5 3.5C7 3.7 7.5 4 7.5 4L8.5 5.5L10 4.5C10 4.5 11 3.5 12 3.5C13 3.5 14 4.5 14 4.5L15.5 5.5L16.5 4C16.5 4 17 3.7 17.5 3.5C19 3 20 4.5 20 6C20 7 19.5 7.5 19 8L18 9C18 9 19 10.5 19 12.5C19 15 17 17 15.5 18L14 19.5V21.5C14 22 13.5 22.5 13 22.5H11C10.5 22.5 10 22 10 21.5V19.5L8.5 18C7 17 5 15 5 12.5C5 10.5 6 9 6 9L5 8C4.5 7.5 4 7 4 6Z" fill="white"/>
          <circle cx="9.5" cy="11" r="1.2" fill="#15803d"/>
          <circle cx="14.5" cy="11" r="1.2" fill="#15803d"/>
          <ellipse cx="12" cy="15" rx="2.5" ry="1.8" fill="#dcfce7" opacity="0.6"/>
          <circle cx="11" cy="15.2" r="0.7" fill="#15803d"/>
          <circle cx="13" cy="15.2" r="0.7" fill="#15803d"/>
        </svg>
      </div>
    ),
    { ...size }
  );
}
