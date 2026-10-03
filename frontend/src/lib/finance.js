const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })

function toMonthKey(dateString) {
  return dateString.slice(0, 7)
}

function getMonthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)

  const toISO = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return {
    dateFrom: toISO(start),
    dateTo: toISO(end),
  }
}

export function getCategories(transactions) {
  return Array.from(new Set(transactions.map((transaction) => transaction.category))).sort()
}

export function filterAndSortTransactions(transactions, filters) {
  const filtered = transactions.filter((transaction) => {
    const normalizedSearch = filters.search.trim().toLowerCase()
    const typePass = filters.type === 'all' ? true : transaction.type === filters.type
    const categoryPass = filters.category === 'all' ? true : transaction.category === filters.category
    const searchPass =
      normalizedSearch.length === 0
        ? true
        : transaction.description.toLowerCase().includes(normalizedSearch) ||
          transaction.category.toLowerCase().includes(normalizedSearch)
    const dateFromPass = filters.dateFrom ? transaction.date >= filters.dateFrom : true
    const dateToPass = filters.dateTo ? transaction.date <= filters.dateTo : true

    return typePass && categoryPass && searchPass && dateFromPass && dateToPass
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
    const currentMonth = toMonthKey(transaction.date)
    const value = transaction.type === 'income' ? transaction.amount : -transaction.amount

    acc[currentMonth] = (acc[currentMonth] ?? 0) + value
    return acc
  }, {})

  const months = Object.keys(monthlyNet).sort()
  let running = 0

  return months.map((month) => {
    running += monthlyNet[month]
    return {
      monthKey: month,
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
    const month = toMonthKey(transaction.date)
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

export function getKpiTrends(transactions) {
  const monthly = transactions.reduce((acc, transaction) => {
    const month = toMonthKey(transaction.date)
    acc[month] = acc[month] ?? { income: 0, expenses: 0 }

    if (transaction.type === 'income') {
      acc[month].income += transaction.amount
    } else {
      acc[month].expenses += transaction.amount
    }

    return acc
  }, {})

  const months = Object.keys(monthly).sort()
  const current = monthly[months[months.length - 1]]
  const previous = monthly[months[months.length - 2]]

  if (!current || !previous) {
    return {
      income: null,
      expenses: null,
      balance: null,
    }
  }

  const safePercent = (currentValue, previousValue) => {
    if (previousValue === 0) {
      return null
    }

    return ((currentValue - previousValue) / previousValue) * 100
  }

  const currentBalance = current.income - current.expenses
  const previousBalance = previous.income - previous.expenses

  return {
    income: safePercent(current.income, previous.income),
    expenses: safePercent(current.expenses, previous.expenses),
    balance: safePercent(currentBalance, previousBalance),
  }
}

export function getBudgetVsActual(transactions, budgets) {
  const expenseTransactions = transactions.filter((transaction) => transaction.type === 'expense')
  const months = Array.from(new Set(expenseTransactions.map((transaction) => toMonthKey(transaction.date)))).sort()
  const activeMonth = months[months.length - 1]

  if (!activeMonth) {
    return []
  }

  const actualByCategory = expenseTransactions
    .filter((transaction) => toMonthKey(transaction.date) === activeMonth)
    .reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] ?? 0) + transaction.amount
      return acc
    }, {})

  const categories = Array.from(new Set([...Object.keys(actualByCategory), ...Object.keys(budgets)])).sort()

  return categories.map((category) => {
    const actual = Number((actualByCategory[category] ?? 0).toFixed(2))
    const budget = Number(budgets[category] ?? 0)
    const remaining = Number((budget - actual).toFixed(2))
    const progress = budget <= 0 ? 0 : Math.min((actual / budget) * 100, 100)

    return {
      category,
      month: activeMonth,
      actual,
      budget,
      remaining,
      progress,
      isOverBudget: budget > 0 && actual > budget,
    }
  })
}

export function getUpcomingRecurringForecast(transactions, daysAhead = 30) {
  const recurringTransactions = transactions.filter((transaction) => transaction.recurring)
  const today = new Date()
  const rangeEnd = new Date(today)
  rangeEnd.setDate(today.getDate() + daysAhead)

  const events = recurringTransactions.map((transaction) => {
    const sourceDate = new Date(`${transaction.date}T00:00:00`)
    const day = sourceDate.getDate()

    const candidate = new Date(today.getFullYear(), today.getMonth(), day)
    if (candidate < today) {
      candidate.setMonth(candidate.getMonth() + 1)
    }

    const nextDate = candidate > rangeEnd ? null : candidate

    return nextDate
      ? {
          id: `${transaction.id}-${nextDate.toISOString().slice(0, 10)}`,
          description: transaction.description,
          category: transaction.category,
          type: transaction.type,
          amount: transaction.amount,
          date: nextDate.toISOString().slice(0, 10),
        }
      : null
  })

  return events.filter(Boolean).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function getCashflowHeatmapData(transactions) {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense')
  const months = Array.from(new Set(expenses.map((transaction) => toMonthKey(transaction.date)))).sort()
  const activeMonth = months[months.length - 1]

  if (!activeMonth) {
    return { activeMonth: null, days: [], maxExpense: 0 }
  }

  const byDay = expenses
    .filter((transaction) => toMonthKey(transaction.date) === activeMonth)
    .reduce((acc, transaction) => {
      const day = Number(transaction.date.slice(8, 10))
      acc[day] = (acc[day] ?? 0) + transaction.amount
      return acc
    }, {})

  const [year, month] = activeMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const maxExpense = Math.max(0, ...Object.values(byDay))

  const leading = Array.from({ length: firstWeekday }, (_, idx) => ({ id: `empty-${idx}`, empty: true }))
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1
    const expense = Number((byDay[day] ?? 0).toFixed(2))
    const intensity = maxExpense === 0 ? 0 : expense / maxExpense

    return {
      id: `${activeMonth}-${day}`,
      day,
      expense,
      intensity,
      empty: false,
    }
  })

  return {
    activeMonth,
    days: [...leading, ...days],
    maxExpense,
  }
}

export function getDateRangeForMonth(monthKey) {
  return getMonthRange(monthKey)
}

export function buildCSV(transactions) {
  const rows = [
    ['id', 'date', 'description', 'amount', 'category', 'type', 'recurring'],
    ...transactions.map((transaction) => [
      transaction.id,
      transaction.date,
      transaction.description,
      transaction.amount,
      transaction.category,
      transaction.type,
      transaction.recurring ? 'yes' : 'no',
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
}
