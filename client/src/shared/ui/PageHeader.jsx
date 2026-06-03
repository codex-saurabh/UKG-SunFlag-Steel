// src/shared/ui/PageHeader.jsx
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div>
      <h1 className="text-[18px] font-semibold text-[#0F172A] leading-tight">{title}</h1>
      {subtitle && (
        <p className="text-[12.5px] text-[#64748B] mt-0.5">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
)

export default PageHeader
