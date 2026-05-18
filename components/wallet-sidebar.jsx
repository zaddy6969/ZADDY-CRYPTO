const ACTIONS = [
  { id: "send", label: "Send" },
  { id: "receive", label: "Receive" },
  { id: "bridge", label: "Bridge" },
  { id: "activity", label: "Activity" }
];

export default function WalletSidebar({
  activeView,
  onSelect,
  onReceive
}) {
  return (
    <aside className="wallet-sidebar card">
      <p className="section-kicker">Wallet</p>
      <nav aria-label="Wallet actions">
        {ACTIONS.map((action) => {
          const isActive = action.id === activeView;

          if (action.id === "receive") {
            return (
              <button
                key={action.id}
                type="button"
                className="sidebar-action"
                onClick={onReceive}
              >
                <span>{action.label}</span>
              </button>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              className={`sidebar-action ${isActive ? "sidebar-action-active" : ""}`}
              onClick={() => onSelect(action.id)}
            >
              <span>{action.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
