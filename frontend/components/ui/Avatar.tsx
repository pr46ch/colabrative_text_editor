type AvatarProps = {
  name: string;
  size?: "sm" | "md";
  showStatus?: boolean;
};

const colors = [
  "#4f46e5",
  "#059669",
  "#db2777",
  "#d97706",
  "#0284c7",
  "#7c3aed"
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getColor(name: string) {
  const total = name
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return colors[total % colors.length];
}

export function Avatar({ name, size = "md", showStatus = false }: AvatarProps) {
  const dimensions = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";

  return (
    <span className="relative inline-flex">
      <span
        className={[
          "grid shrink-0 place-items-center rounded-full border-2 border-white font-bold text-white shadow-sm",
          dimensions
        ].join(" ")}
        style={{ backgroundColor: getColor(name) }}
        aria-label={name}
        title={name}
      >
        {getInitials(name)}
      </span>
      {showStatus ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
      ) : null}
    </span>
  );
}
