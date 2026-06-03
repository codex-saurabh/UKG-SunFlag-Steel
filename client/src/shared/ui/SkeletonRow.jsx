// src/shared/ui/SkeletonRow.jsx
export const SkeletonRow = ({ cols = 6 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-3 py-3">
        <div
          className="skeleton h-3 rounded"
          style={{ width: `${60 + Math.random() * 30}%` }}
        />
      </td>
    ))}
  </tr>
)

export const SkeletonTable = ({ rows = 8, cols = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonRow key={i} cols={cols} />
    ))}
  </>
)

export default SkeletonTable