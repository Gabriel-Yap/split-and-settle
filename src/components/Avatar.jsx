export default function Avatar({ user, size = 38 }) {
  return (
    <div
      className="avatar"
      style={{
        width: size, height: size,
        background: user.bg,
        color: user.color,
        fontSize: size * 0.37,
      }}
    >
      {user.initials}
    </div>
  )
}
