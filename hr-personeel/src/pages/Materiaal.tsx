import {
  Laptop,
  ExternalLink,
  Package,
  Monitor,
  Smartphone,
  Headphones,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function Materiaal() {
  // This page links to Djoppie Inventory
  const inventoryUrl = 'https://inventory.djoppie.be'; // Placeholder URL

  const assetCategories = [
    { icon: Laptop, label: 'Laptops', count: 245, available: 12 },
    { icon: Monitor, label: 'Monitoren', count: 380, available: 25 },
    { icon: Smartphone, label: 'Telefoons', count: 120, available: 8 },
    { icon: Headphones, label: 'Headsets', count: 95, available: 15 },
  ];

  const recentRequests = [
    {
      id: '1',
      user: 'Jan Janssen',
      item: 'Dell Latitude 5540',
      status: 'pending',
      date: '2026-02-26',
    },
    {
      id: '2',
      user: 'Marie Peeters',
      item: 'iPhone 15 Pro',
      status: 'approved',
      date: '2026-02-25',
    },
    {
      id: '3',
      user: 'Pieter Willems',
      item: 'Jabra Headset',
      status: 'delivered',
      date: '2026-02-24',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="status-badge status-success">
            <CheckCircle size={12} /> Geleverd
          </span>
        );
      case 'approved':
        return (
          <span className="status-badge status-info">
            <Clock size={12} /> Goedgekeurd
          </span>
        );
      default:
        return (
          <span className="status-badge status-warning">
            <AlertCircle size={12} /> In behandeling
          </span>
        );
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Materiaal</h1>
          <p className="page-subtitle">
            Overzicht van IT-materiaal en koppelingen naar Djoppie Inventory
          </p>
        </div>
        <a
          href={inventoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          <ExternalLink size={16} />
          Open Djoppie Inventory
        </a>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <Package size={24} />
        <div className="info-banner-content">
          <h3>Geïntegreerd met Djoppie Inventory</h3>
          <p>
            Het volledige materiaalbeheer wordt gedaan in Djoppie Inventory.
            Hieronder zie je een samenvatting van de huidige status.
          </p>
        </div>
        <a
          href={inventoryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          Ga naar Inventory
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Asset Categories */}
      <div className="section-header">
        <h2>Materiaal Overzicht</h2>
      </div>

      <div className="asset-grid">
        {assetCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="asset-card">
              <div className="asset-icon">
                <Icon size={28} />
              </div>
              <div className="asset-info">
                <h3>{category.label}</h3>
                <div className="asset-stats">
                  <span className="asset-total">{category.count} totaal</span>
                  <span className="asset-available">
                    {category.available} beschikbaar
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Requests */}
      <div className="section-header">
        <h2>Recente Aanvragen</h2>
        <a href={inventoryUrl} target="_blank" rel="noopener noreferrer" className="link">
          Alle aanvragen bekijken <ArrowRight size={14} />
        </a>
      </div>

      <div className="requests-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medewerker</th>
              <th>Item</th>
              <th>Status</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {recentRequests.map(request => (
              <tr key={request.id}>
                <td>{request.user}</td>
                <td>{request.item}</td>
                <td>{getStatusBadge(request.status)}</td>
                <td>{new Date(request.date).toLocaleDateString('nl-BE')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className="section-header">
        <h2>Snelle Acties</h2>
      </div>

      <div className="quick-actions">
        <a
          href={`${inventoryUrl}/request`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card"
        >
          <Laptop size={24} />
          <span>Materiaal Aanvragen</span>
          <ArrowRight size={16} />
        </a>
        <a
          href={`${inventoryUrl}/return`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card"
        >
          <Package size={24} />
          <span>Materiaal Inleveren</span>
          <ArrowRight size={16} />
        </a>
        <a
          href={`${inventoryUrl}/report`}
          target="_blank"
          rel="noopener noreferrer"
          className="action-card"
        >
          <AlertCircle size={24} />
          <span>Defect Melden</span>
          <ArrowRight size={16} />
        </a>
      </div>

      <style>{`
        .info-banner {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px 24px;
          background: linear-gradient(135deg, var(--color-primary-bg), var(--bg-card));
          border: 1px solid var(--color-primary);
          border-radius: var(--border-radius-lg);
          margin-bottom: 32px;
        }

        .info-banner > svg {
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .info-banner-content {
          flex: 1;
        }

        .info-banner-content h3 {
          margin: 0 0 4px;
          font-size: 16px;
          font-weight: 600;
        }

        .info-banner-content p {
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .section-header .link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--color-primary);
          text-decoration: none;
        }

        .section-header .link:hover {
          text-decoration: underline;
        }

        .asset-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .asset-card {
          background: var(--bg-card);
          border-radius: var(--border-radius-lg);
          padding: 20px;
          display: flex;
          gap: 16px;
          align-items: center;
          box-shadow: var(--shadow-md);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .asset-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .asset-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .asset-info h3 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
        }

        .asset-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
        }

        .asset-total {
          color: var(--text-secondary);
        }

        .asset-available {
          color: var(--color-success);
          font-weight: 500;
        }

        .requests-table {
          margin-bottom: 32px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .action-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          text-decoration: none;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .action-card:hover {
          border-color: var(--color-primary);
          background: var(--color-primary-bg);
        }

        .action-card svg:first-child {
          color: var(--color-primary);
        }

        .action-card span {
          flex: 1;
          font-weight: 500;
          font-size: 14px;
        }

        .action-card svg:last-child {
          color: var(--text-muted);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.status-success {
          background: var(--color-success-bg);
          color: var(--color-success);
        }

        .status-badge.status-info {
          background: var(--color-info-bg);
          color: var(--color-info);
        }

        .status-badge.status-warning {
          background: var(--color-warning-bg);
          color: var(--color-warning);
        }

        @media (max-width: 768px) {
          .info-banner {
            flex-direction: column;
            text-align: center;
          }

          .asset-grid {
            grid-template-columns: 1fr;
          }

          .quick-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
