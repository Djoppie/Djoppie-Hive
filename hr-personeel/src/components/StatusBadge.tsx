import type { ValidatieStatus } from '../types';

const statusConfig: Record<ValidatieStatus, { label: string; className: string }> = {
  nieuw: { label: 'Nieuw', className: 'badge-status badge-nieuw' },
  in_review: { label: 'In Review', className: 'badge-status badge-review' },
  goedgekeurd: { label: 'Goedgekeurd', className: 'badge-status badge-goedgekeurd' },
  afgekeurd: { label: 'Afgekeurd', className: 'badge-status badge-afgekeurd' },
  aangepast: { label: 'Aangepast', className: 'badge-status badge-aangepast' },
};

export default function StatusBadge({ status }: { status: ValidatieStatus }) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}
