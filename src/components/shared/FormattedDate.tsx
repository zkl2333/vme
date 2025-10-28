const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

/**
 * 格式化日期组件
 */
export function FormattedDate({
  date,
  ...props
}: React.ComponentPropsWithoutRef<'time'> & { date: string | Date }) {
  if (!date) {
    return <time {...props}>-</time>
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return <time {...props}>Invalid Date</time>
  }

  return (
    <time dateTime={dateObj.toISOString()} {...props}>
      {dateFormatter.format(dateObj)}
    </time>
  )
}

