/*
 * Debt payoff simulation with four strategies: avalanche (highest
 * interest first), snowball (smallest balance first), urgency
 * (real-world consequences first, e.g. rent/Krankenkasse/AHV, see
 * creditorTypes.js), or equal (extra split evenly across every open
 * debt at once). Every month, interest accrues on every debt and
 * minimum payments are made on every debt; the three sequential
 * strategies then funnel the whole extra budget into one target debt
 * at a time, while equal splits it across all open debts. Once a debt
 * hits zero, its minimum payment is freed up and joins the extra pool
 * -- that roll-over is what makes every strategy pay off debt faster
 * than paying minimums alone.
 */
const DebtPlanner = {
  MAX_MONTHS: 600, // 50 years safety cap so a bad input can't loop forever

  simulate(inputDebts, extraMonthly, strategy) {
    const debts = inputDebts.map((d) => ({
      id: d.id,
      name: d.name,
      balance: Number(d.balance) || 0,
      apr: Number(d.apr) || 0,
      minPayment: Number(d.minPayment) || 0,
      creditorType: d.creditorType || DEFAULT_CREDITOR_TYPE
    }));

    if (debts.length === 0) {
      return { feasible: true, empty: true };
    }

    const order = this._sortOrder(debts, strategy);
    const payoffMonth = {};
    const interestPaid = {};
    order.forEach((id) => {
      payoffMonth[id] = null;
      interestPaid[id] = 0;
    });

    const balanceHistory = [debts.reduce((sum, d) => sum + d.balance, 0)];
    let totalInterestPaid = 0;
    let month = 0;
    let extraPool = Number(extraMonthly) || 0;

    while (debts.some((d) => d.balance > 0.005) && month < this.MAX_MONTHS) {
      month++;
      let freedUpThisMonth = 0;

      // 1. accrue interest and pay the minimum on every open debt
      for (const debt of debts) {
        if (debt.balance <= 0.005) continue;
        const monthlyInterest = (debt.balance * (debt.apr / 100)) / 12;
        debt.balance += monthlyInterest;
        totalInterestPaid += monthlyInterest;
        interestPaid[debt.id] += monthlyInterest;

        const payment = Math.min(debt.minPayment, debt.balance);
        debt.balance -= payment;

        if (debt.balance <= 0.005 && payoffMonth[debt.id] === null) {
          payoffMonth[debt.id] = month;
          freedUpThisMonth += debt.minPayment - payment; // usually 0, but keep it exact
        }
      }

      // 2. distribute the extra budget (plus anything freed up)
      let available = extraPool + freedUpThisMonth;
      if (strategy === "equal") {
        // split evenly across every debt that's still open
        const openIds = debts.filter((d) => d.balance > 0.005).map((d) => d.id);
        if (available > 0 && openIds.length > 0) {
          const share = available / openIds.length;
          for (const id of openIds) {
            const debt = debts.find((d) => d.id === id);
            const payment = Math.min(share, debt.balance);
            debt.balance -= payment;
            if (debt.balance <= 0.005 && payoffMonth[debt.id] === null) {
              payoffMonth[debt.id] = month;
            }
          }
        }
      } else {
        // funnel the whole amount into the target debt(s), in order
        for (const id of order) {
          if (available <= 0) break;
          const debt = debts.find((d) => d.id === id);
          if (!debt || debt.balance <= 0.005) continue;
          const payment = Math.min(available, debt.balance);
          debt.balance -= payment;
          available -= payment;
          if (debt.balance <= 0.005 && payoffMonth[debt.id] === null) {
            payoffMonth[debt.id] = month;
          }
        }
      }

      balanceHistory.push(debts.reduce((sum, d) => sum + Math.max(d.balance, 0), 0));
    }

    const feasible = debts.every((d) => d.balance <= 0.005);

    return {
      feasible,
      empty: false,
      totalMonths: month,
      totalInterestPaid,
      balanceHistory,
      order: order.map((id) => {
        const original = inputDebts.find((d) => d.id === id);
        return {
          id,
          name: original.name,
          creditorType: original.creditorType || DEFAULT_CREDITOR_TYPE,
          minPayment: Number(original.minPayment) || 0,
          payoffMonth: payoffMonth[id],
          interestPaid: interestPaid[id]
        };
      })
    };
  },

  /*
   * Turns the simulation result into a concrete "who gets how many CHF,
   * and until when" schedule. A new phase starts every time a debt is
   * fully paid off, because that's when its minimum payment frees up
   * and joins the extra pool -- so the payment amounts only change at
   * those points, not every single month. Phases are walked in the
   * order debts actually get paid off (by payoffMonth), which for the
   * sequential strategies matches `order` already, and for "equal" is
   * whichever debt happens to hit zero first.
   */
  derivePaymentPlan(order, extraMonthly, strategy) {
    const byPayoff = order.filter((d) => d.payoffMonth !== null).sort((a, b) => a.payoffMonth - b.payoffMonth);
    let openDebts = order.map((d) => ({ id: d.id, name: d.name, minPayment: d.minPayment }));
    let extraPool = Number(extraMonthly) || 0;
    let prevMonth = 0;
    const phases = [];

    byPayoff.forEach((entry) => {
      const fromMonth = prevMonth + 1;
      const toMonth = Math.max(entry.payoffMonth, fromMonth);
      const isEqual = strategy === "equal";
      const share = isEqual && openDebts.length > 0 ? extraPool / openDebts.length : extraPool;

      phases.push({
        fromMonth,
        toMonth,
        targetName: entry.name,
        equalSplit: isEqual,
        payments: openDebts.map((d) => ({
          id: d.id,
          name: d.name,
          amount: d.minPayment + (isEqual || d.id === entry.id ? share : 0)
        }))
      });

      extraPool += entry.minPayment;
      openDebts = openDebts.filter((d) => d.id !== entry.id);
      prevMonth = entry.payoffMonth;
    });

    return phases;
  },

  _sortOrder(debts, strategy) {
    const copy = [...debts];
    if (strategy === "equal") {
      // no targeting order needed -- kept as entered, just for display
    } else if (strategy === "snowball") {
      copy.sort((a, b) => a.balance - b.balance);
    } else if (strategy === "urgency") {
      copy.sort((a, b) => this._urgencyOf(b) - this._urgencyOf(a) || b.apr - a.apr);
    } else {
      copy.sort((a, b) => b.apr - a.apr);
    }
    return copy.map((d) => d.id);
  },

  _urgencyOf(debt) {
    const type = CREDITOR_TYPE_BY_ID[debt.creditorType];
    return type ? type.urgency : CREDITOR_TYPE_BY_ID[DEFAULT_CREDITOR_TYPE].urgency;
  }
};
