/*
 * Minimal dependency-free line chart (plain canvas 2D) showing total
 * remaining debt balance over time. Not a general charting library --
 * just enough to visualize one series without pulling in an external
 * script.
 */
const Chart = {
  drawBalanceHistory(canvas, balanceHistory) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 600;
    const cssHeight = canvas.clientHeight || 220;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const padding = { top: 16, right: 16, bottom: 28, left: 56 };
    const plotWidth = cssWidth - padding.left - padding.right;
    const plotHeight = cssHeight - padding.top - padding.bottom;

    const maxBalance = Math.max(...balanceHistory, 1);
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue("--color-primary").trim() || "#1c6e5c";
    const muted = styles.getPropertyValue("--color-muted").trim() || "#5b6270";
    const border = styles.getPropertyValue("--color-border").trim() || "#dde1e7";

    const xFor = (i) => padding.left + (i / (balanceHistory.length - 1 || 1)) * plotWidth;
    const yFor = (v) => padding.top + plotHeight - (v / maxBalance) * plotHeight;

    // axes
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + plotHeight);
    ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
    ctx.stroke();

    // y-axis labels (0 and max)
    ctx.fillStyle = muted;
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(this._formatChf(maxBalance), padding.left - 8, padding.top + 4);
    ctx.fillText("0", padding.left - 8, padding.top + plotHeight);

    // x-axis labels (start, end in years)
    ctx.textAlign = "left";
    ctx.fillText("Jetzt", padding.left, cssHeight - 8);
    const years = ((balanceHistory.length - 1) / 12).toFixed(1);
    ctx.textAlign = "right";
    ctx.fillText(`${years} Jahre`, padding.left + plotWidth, cssHeight - 8);

    // line
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    balanceHistory.forEach((v, i) => {
      const x = xFor(i);
      const y = yFor(Math.max(v, 0));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  },

  _formatChf(v) {
    return "CHF " + Math.round(v).toLocaleString("de-CH");
  }
};
