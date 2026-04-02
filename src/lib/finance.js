const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

export function getCategories(transactions) {
  return Array.from(new Set(transactions.map((transaction) => transaction.category))).sort()
}

export function filterAndSortTransactions(transactions, filters) {
  const filtered = transactions.filter((transaction) => {
    const typePass = filters.type === 'all' ? true : transaction.type === filters.type
    const categoryPass = filters.category === 'all' ? true : transaction.category === filters.category
    const searchPass = transaction.description.toLowerCase().includes(filters.search.trim().toLowerCase())

    return typePass && categoryPass && searchPass
  })

  const sorted = [...filtered].sort((a, b) => {
    const multiplier = filters.sortOrder === 'asc' ? 1 : -1

    if (filters.sortBy === 'amount') {
      return (a.amount - b.amount) * multiplier
    }

    return (new Date(a.date).getTime() - new Date(b.date).getTime()) * multiplier
  })

  return sorted
}

export function getSummaryStats(transactions) {
  const income = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return {
    income,
    expenses,
    balance: income - expenses,
  }
}

export function getMonthlyBalanceTrend(transactions) {
  const monthlyNet = transactions.reduce((acc, transaction) => {
    const currentMonth = transaction.date.slice(0, 7)
    const value = transaction.type === 'income' ? transaction.amount : -transaction.amount

    acc[currentMonth] = (acc[currentMonth] ?? 0) + value
    return acc
  }, {})

  const months = Object.keys(monthlyNet).sort()
  let running = 0

  return months.map((month) => {
    running += monthlyNet[month]
    return {
      month: monthLabel.format(new Date(`${month}-01`)),
      balance: Number(running.toFixed(2)),
    }
  })
}

export function getCategoryBreakdown(transactions) {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense')

  const breakdown = expenses.reduce((acc, transaction) => {
    acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
    return acc
  }, {})

  return Object.entries(breakdown)
    .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
    .sort((a, b) => b.value - a.value)
}

export function getInsights(transactions) {
  const expenseBreakdown = getCategoryBreakdown(transactions)
  const topSpendingCategory = expenseBreakdown[0]

  const byMonth = transactions.reduce((acc, transaction) => {
    const month = transaction.date.slice(0, 7)
    acc[month] = acc[month] ?? { income: 0, expense: 0, count: 0 }
    acc[month].count += 1

    if (transaction.type === 'income') {
      acc[month].income += transaction.amount
    } else {
      acc[month].expense += transaction.amount
    }

    return acc
  }, {})

  const months = Object.keys(byMonth).sort()
  const currentMonth = months[months.length - 1]
  const previousMonth = months[months.length - 2]

  const currentExpense = currentMonth ? byMonth[currentMonth].expense : 0
  const previousExpense = previousMonth ? byMonth[previousMonth].expense : 0

  const monthOverMonth = previousExpense === 0 ? null : ((currentExpense - previousExpense) / previousExpense) * 100

  const averageTransaction =
    transactions.length === 0
      ? 0
      : transactions.reduce((sum, transaction) => sum + transaction.amount, 0) / transactions.length

  return {
    topSpendingCategory,
    monthOverMonth,
    averageTransaction,
    transactionsThisMonth: currentMonth ? byMonth[currentMonth].count : 0,
  }
}

export function buildCSV(transactions) {
  const rows = [
    ['id', 'date', 'description', 'amount', 'category', 'type'],
    ...transactions.map((transaction) => [
      transaction.id,
      transaction.date,
      transaction.description,
      transaction.amount,
      transaction.category,
      transaction.type,
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
}
