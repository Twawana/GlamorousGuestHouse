export default function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
      <div style={{
        width: 36, height: 36, border: "2px solid #2A2118",
        borderTop: "2px solid #C9A96E", borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
