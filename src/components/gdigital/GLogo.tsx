interface Props {
  size?: number;
}
export function GLogo({ size = 120 }: Props) {
  return (
    <img
      src="https://i.postimg.cc/J0JB20n7/Dizajn-bez-nazvania.png"
      alt="Logo"
      style={{ width: size, height: size }}
      className="rounded-2xl object-cover drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]"
    />
  );
}
