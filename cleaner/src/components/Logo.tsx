import logo from '../assets/logo.png'

export function Logo({ size = 120 }: { size?: number }) {
  return (
    <img
      src={logo}
      alt="Muncie Maids"
      width={size}
      height={size}
      className="object-contain drop-shadow-sm"
      style={{ width: size, height: size }}
    />
  )
}
