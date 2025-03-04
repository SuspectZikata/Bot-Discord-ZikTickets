const { getTicketStats } = require('./ticketManager');

function generateTicketGraph() {
  const stats = getTicketStats();
  const total = stats.totalCreated;
  const closed = stats.totalClosed;
  const open = total - closed;

  // Calcular largura máxima para o gráfico
  const maxWidth = 20;
  const maxValue = Math.max(total, closed, open);
  const scale = maxValue > 0 ? maxWidth / maxValue : 0;

  // Função para criar barra
  function createBar(value, maxValue) {
    const barLength = Math.round(value * scale);
    const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    const bar = '█'.repeat(barLength) + '░'.repeat(maxWidth - barLength);
    return `${bar} ${percentage}%`;
  }

  // Criar visualização
  const visualization = [
    '📊 Estatísticas de Tickets',
    '',
    `Total de Tickets: ${total}`,
    `Criados: ${createBar(total, maxValue)}`,
    `Fechados: ${createBar(closed, maxValue)}`,
    `Abertos: ${createBar(open, maxValue)}`,
    '',
    'Legenda:',
    '█ - Proporção',
    '░ - Restante',
    '',
    `Tempo Médio de Resolução: ${formatTime(stats.averageResolutionTime)}`
  ].join('\n');

  return visualization;
}

function formatTime(ms) {
  if (ms <= 0) return 'N/A';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

module.exports = {
  generateTicketGraph
}; 