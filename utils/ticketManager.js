const fs = require('fs');
const path = require('path');
const { 
  ChannelType, 
  PermissionFlagsBits,
  MessageFlags, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const config = require('../config.json');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '../database/tickets.json');

// Carregar banco de dados de tickets
function loadTicketDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar o banco de dados de tickets:', error);
    // Retorna a estrutura padrão se o arquivo não existir ou for inválido
    return { tickets: [], stats: { totalCreated: 0, totalClosed: 0, averageResolutionTime: 0 } };
  }
}

// Salvar banco de dados de tickets
function saveTicketDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar o banco de dados de tickets:', error);
    return false;
  }
}

// Criar um novo ticket
async function createTicket(interaction, ticketType) {
  const { guild, user } = interaction;
  const db = loadTicketDB();
  
  // Verificar se o usuário atingiu o número máximo de tickets
  const userTickets = db.tickets.filter(ticket => 
    ticket.userId === user.id && ticket.status === 'open'
  );
  
  if (userTickets.length >= config.ticketSettings.maxTicketsPerUser) {
    return {
      success: false,
      message: `Você já possui ${userTickets.length} tickets abertos. Por favor, feche algum antes de abrir um novo.`,
      flags: MessageFlags.Ephemeral
    };
  }
  
  // Obter informações do tipo de ticket
  const typeInfo = config.ticketTypes.find(type => type.id === ticketType);
  if (!typeInfo) {
    return {
      success: false,
      message: 'Tipo de ticket inválido.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  // Gerar número do ticket
  const ticketNumber = db.stats.totalCreated + 1;
  const ticketId = `ticket-${ticketNumber.toString().padStart(4, '0')}`;
  
  try {
    // Criar canal do ticket
    const channel = await guild.channels.create({
      name: `${typeInfo.emoji}│${ticketId}-${user.username}`,
      type: ChannelType.GuildText,
      parent: config.ticketSettings.categoryId || null,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: config.ticketSettings.supportRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        }
      ]
    });
    
    // Criar embed de boas-vindas
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Ticket: ${typeInfo.label} #${ticketNumber}`)
      .setDescription(`${config.messages.ticketCreated}`)
      .addFields(
        { name: 'Criado por', value: `<@${user.id}>`, inline: true },
        { name: 'Categoria', value: typeInfo.label, inline: true },
        { name: 'ID do Ticket', value: ticketId, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    // Criar linha de ação com botões
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Fechar')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Atender')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✋')
      );
    
    // Criar segunda linha com mais botões
    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_add_user')
          .setLabel('Adicionar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👥'),
        new ButtonBuilder()
          .setCustomId('ticket_remove_user')
          .setLabel('Remover')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🚫'),
        new ButtonBuilder()
          .setCustomId('ticket_priority')
          .setLabel('Prioridade')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚡')
      );
    
    // Criar terceira linha com ainda mais botões
    const row3 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_edit')
          .setLabel('Editar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝'),
        new ButtonBuilder()
          .setCustomId('ticket_notify')
          .setLabel('Notificar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔔'),
        new ButtonBuilder()
          .setCustomId('ticket_transfer')
          .setLabel('Transferir')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId('ticket_unclaim')
          .setLabel('Abdicar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId('ticket_schedule_close')
          .setLabel('Agendar')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📅')
      );
    
    // Enviar mensagem de boas-vindas
    await channel.send({ 
      content: `<@${user.id}> <@&${config.ticketSettings.supportRoleId}>`,
      embeds: [embed],
      components: [row, row2, row3]
    });
    
    // Adicionar ticket ao banco de dados
    const ticketData = {
      id: ticketId,
      channelId: channel.id,
      userId: user.id,
      type: ticketType,
      title: `Ticket: ${typeInfo.label} #${ticketNumber}`,
      description: '',
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      claimedBy: null,
      closedAt: null,
      closedBy: null,
      scheduledClose: null,
      participants: [user.id]
    };
    
    db.tickets.push(ticketData);
    db.stats.totalCreated++;
    saveTicketDB(db);
    
    return {
      success: true,
      message: `Ticket criado com sucesso! Acesse-o em ${channel}.`,
      channel: channel,
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao criar o ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao criar o ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Fechar um ticket
async function closeTicket(interaction, ticketId, closedBy) {
  const { guild } = interaction;
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Este ticket já está fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Atualizar ticket no banco de dados
    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    ticket.closedBy = closedBy;
    ticket.scheduledClose = null; // Limpar qualquer fechamento agendado
    
    // Calcular tempo de resolução
    const createdAt = new Date(ticket.createdAt);
    const closedAt = new Date(ticket.closedAt);
    const resolutionTime = closedAt - createdAt;
    
    // Atualizar estatísticas
    db.stats.totalClosed++;
    const totalResolutionTime = db.stats.averageResolutionTime * (db.stats.totalClosed - 1) + resolutionTime;
    db.stats.averageResolutionTime = totalResolutionTime / db.stats.totalClosed;
    
    db.tickets[ticketIndex] = ticket;
    saveTicketDB(db);
    
    // Obter canal
    const channel = guild.channels.cache.get(ticket.channelId);
    if (!channel) {
      return {
        success: false,
        message: 'Canal do ticket não encontrado.',
        flags: MessageFlags.Ephemeral
      };
    }
    
    // Criar embed de fechamento
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle(`Ticket Fechado: ${ticketId}`)
      .setDescription(config.messages.ticketClosed)
      .addFields(
        { name: 'Fechado por', value: `<@${closedBy}>`, inline: true },
        { name: 'Tempo de resolução', value: formatDuration(resolutionTime), inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    // Criar linha de ação com botões
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_reopen')
          .setLabel('Reabrir Ticket')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔓'),
        new ButtonBuilder()
          .setCustomId('ticket_delete')
          .setLabel('Excluir Ticket')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️'),
        new ButtonBuilder()
          .setCustomId('ticket_transcript')
          .setLabel('Gerar Histórico')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );
    
    // Enviar mensagem de fechamento
    await channel.send({ 
      embeds: [embed],
      components: [row]
    });
    
    // Atualizar permissões do canal
    await channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false
    });
    
    // Gerar histórico se estiver habilitado
    if (config.ticketSettings.transcriptEnabled) {
      // Isso seria implementado com uma função de geração de histórico
      // Por enquanto, apenas registramos que seria gerado
      console.log(`Histórico seria gerado para o ticket ${ticketId}`);
    }
    
    return {
      success: true,
      message: 'Ticket fechado com sucesso!',
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao fechar o ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao fechar o ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Atender um ticket
async function claimTicket(interaction, ticketId, userId) {
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Não é possível atender um ticket fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (ticket.claimedBy === userId) {
    return {
      success: false,
      message: 'Você já está atendendo este ticket.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Atualizar ticket no banco de dados
    ticket.claimedBy = userId;
    db.tickets[ticketIndex] = ticket;
    saveTicketDB(db);
    
    // Criar embed de atendimento
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`Ticket Atendido: ${ticketId}`)
      .setDescription(`Este ticket agora está sendo atendido por <@${userId}>.`)
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    return {
      success: true,
      message: 'Ticket atendido com sucesso!',
      embed: embed,
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao atender o ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao atender o ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Abdicar de um ticket
async function unclaimTicket(interaction, ticketId, userId) {
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Não é possível abdicar de um ticket fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (!ticket.claimedBy) {
    return {
      success: false,
      message: 'Este ticket não está sendo atendido por ninguém.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (ticket.claimedBy !== userId && !interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return {
      success: false,
      message: 'Você não pode abdicar de um ticket que não está atendendo.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Atualizar ticket no banco de dados
    const previousClaimedBy = ticket.claimedBy;
    ticket.claimedBy = null;
    db.tickets[ticketIndex] = ticket;
    saveTicketDB(db);
    
    // Criar embed de abdicação
    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`Ticket Liberado: ${ticketId}`)
      .setDescription(`<@${userId}> abdicou do atendimento deste ticket.`)
      .addFields(
        { name: 'Atendido anteriormente por', value: `<@${previousClaimedBy}>`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    return {
      success: true,
      message: 'Você abdicou do atendimento deste ticket com sucesso!',
      embed: embed,
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao abdicar do ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao abdicar do ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Transferir um ticket
async function transferTicket(interaction, ticketId, newUserId) {
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Não é possível transferir um ticket fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (ticket.claimedBy === newUserId) {
    return {
      success: false,
      message: 'Este ticket já está sendo atendido por este usuário.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Atualizar ticket no banco de dados
    const previousClaimedBy = ticket.claimedBy;
    ticket.claimedBy = newUserId;
    db.tickets[ticketIndex] = ticket;
    saveTicketDB(db);
    
    // Criar embed de transferência
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Ticket Transferido: ${ticketId}`)
      .setDescription(`Este ticket foi transferido para <@${newUserId}> por <@${interaction.user.id}>.`)
      .addFields(
        { name: 'Atendido anteriormente por', value: previousClaimedBy ? `<@${previousClaimedBy}>` : 'Ninguém', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    return {
      success: true,
      message: 'Ticket transferido com sucesso!',
      embed: embed,
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao transferir o ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao transferir o ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Adicionar usuário ao ticket
async function addUserToTicket(interaction, ticketId, userId) {
  const { guild } = interaction;
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Não é possível adicionar usuários a um ticket fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (ticket.participants.includes(userId)) {
    return {
      success: false,
      message: 'Este usuário já está no ticket.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Obter canal
    const channel = guild.channels.cache.get(ticket.channelId);
    if (!channel) {
      return {
        success: false,
        message: 'Canal do ticket não encontrado.',
        flags: MessageFlags.Ephemeral
      };
    }
    
    // Tentar buscar o usuário
    try {
      const user = await guild.members.fetch(userId);
      
      // Atualizar permissões do canal
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });
      
      // Atualizar ticket no banco de dados
      ticket.participants.push(userId);
      db.tickets[ticketIndex] = ticket;
      saveTicketDB(db);
      
      return {
        success: true,
        message: `<@${userId}> foi adicionado ao ticket com sucesso!`,
        flags: MessageFlags.Ephemeral
      };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return {
        success: false,
        message: 'Usuário não encontrado. Verifique se o ID está correto.',
        flags: MessageFlags.Ephemeral
      };
    }
  } catch (error) {
    console.error('Erro ao adicionar usuário ao ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao adicionar o usuário ao ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Remover usuário do ticket
async function removeUserFromTicket(interaction, ticketId, userId) {
  const { guild } = interaction;
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  
  // Verificar se o usuário é o criador do ticket
  if (ticket.userId === userId) {
    return {
      success: false,
      message: 'Não é possível remover o criador do ticket.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  // Verificar se o usuário está no ticket
  if (!ticket.participants.includes(userId)) {
    return {
      success: false,
      message: 'Este usuário não está no ticket.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Obter canal
    const channel = guild.channels.cache.get(ticket.channelId);
    if (!channel) {
      return {
        success: false,
        message: 'Canal do ticket não encontrado.',
        flags: MessageFlags.Ephemeral
      };
    }
    
    // Tentar buscar o usuário
    try {
      const user = await guild.members.fetch(userId);
      
      // Atualizar permissões do canal
      await channel.permissionOverwrites.delete(user.id);
      
      // Atualizar ticket no banco de dados
      ticket.participants = ticket.participants.filter(id => id !== userId);
      
      // Se o usuário estava atendendo o ticket, liberar o atendimento
      if (ticket.claimedBy === userId) {
        ticket.claimedBy = null;
      }
      
      db.tickets[ticketIndex] = ticket;
      saveTicketDB(db);
      
      return {
        success: true,
        message: `<@${userId}> foi removido do ticket com sucesso!`,
        flags: MessageFlags.Ephemeral
      };
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return {
        success: false,
        message: 'Usuário não encontrado. Verifique se o ID está correto.',
        flags: MessageFlags.Ephemeral
      };
    }
  } catch (error) {
    console.error('Erro ao remover usuário do ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao remover o usuário do ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Definir prioridade do ticket
async function setTicketPriority(interaction, ticketId, priority) {
  const db = loadTicketDB();
  
  // Encontrar ticket no banco de dados
  const ticketIndex = db.tickets.findIndex(ticket => ticket.id === ticketId);
  if (ticketIndex === -1) {
    return {
      success: false,
      message: 'Ticket não encontrado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  const ticket = db.tickets[ticketIndex];
  if (ticket.status === 'closed') {
    return {
      success: false,
      message: 'Não é possível alterar a prioridade de um ticket fechado.',
      flags: MessageFlags.Ephemeral
    };
  }
  
  if (ticket.priority === priority) {
    return {
      success: false,
      message: `Este ticket já está com prioridade ${priority}.`,
      flags: MessageFlags.Ephemeral
    };
  }
  
  try {
    // Atualizar ticket no banco de dados
    ticket.priority = priority;
    db.tickets[ticketIndex] = ticket;
    saveTicketDB(db);
    
    // Obter cor e emoji da prioridade
    let color, emoji;
    switch (priority) {
      case 'low':
        color = '#00ff00';
        emoji = '🟢';
        break;
      case 'normal':
        color = '#ffff00';
        emoji = '🟡';
        break;
      case 'high':
        color = '#ff9900';
        emoji = '🟠';
        break;
      case 'urgent':
        color = '#ff0000';
        emoji = '🔴';
        break;
      default:
        color = '#ffff00';
        emoji = '🟡';
    }
    
    // Criar embed de prioridade
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`Prioridade Alterada: ${ticketId}`)
      .setDescription(`A prioridade deste ticket foi alterada para ${emoji} **${priority.toUpperCase()}**.`)
      .setTimestamp()
      .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
    
    return {
      success: true,
      message: `Prioridade alterada para ${priority} com sucesso!`,
      embed: embed,
      flags: MessageFlags.Ephemeral
    };
  } catch (error) {
    console.error('Erro ao definir a prioridade do ticket:', error);
    return {
      success: false,
      message: 'Ocorreu um erro ao alterar a prioridade do ticket. Por favor, tente novamente.',
      flags: MessageFlags.Ephemeral
    };
  }
}

// Obter ticket pelo ID do canal
function getTicketByChannelId(channelId) {
  const db = loadTicketDB();
  return db.tickets.find(ticket => ticket.channelId === channelId);
}

// Obter ticket pelo ID
function getTicketById(ticketId) {
  const db = loadTicketDB();
  return db.tickets.find(ticket => ticket.id === ticketId);
}

// Obter tickets do usuário
function getUserTickets(userId) {
  const db = loadTicketDB();
  return db.tickets.filter(ticket => ticket.userId === userId);
}

// Obter estatísticas dos tickets
function getTicketStats() {
  return loadTicketDB().stats;
}

// Função auxiliar para formatar duração
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function getHandlerRankings() {
  const db = loadTicketDB();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Função auxiliar para contar tickets por handler
  function countTicketsByHandler(tickets) {
    const handlerCounts = {};
    
    tickets.forEach(ticket => {
      if (ticket.claimedBy) {
        handlerCounts[ticket.claimedBy] = (handlerCounts[ticket.claimedBy] || 0) + 1;
      }
    });

    return Object.entries(handlerCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 handlers
  }

  // Rankings total
  const totalRankings = countTicketsByHandler(db.tickets);

  // Rankings mensais
  const monthlyTickets = db.tickets.filter(ticket => 
    new Date(ticket.createdAt) >= monthAgo
  );
  const monthlyRankings = countTicketsByHandler(monthlyTickets);

  // Rankings semanais
  const weeklyTickets = db.tickets.filter(ticket => 
    new Date(ticket.createdAt) >= weekAgo
  );
  const weeklyRankings = countTicketsByHandler(weeklyTickets);

  return {
    total: totalRankings,
    monthly: monthlyRankings,
    weekly: weeklyRankings
  };
}

function resetTicketData() {
  const defaultData = {
    tickets: [],
    stats: {
      totalCreated: 0,
      totalClosed: 0,
      averageResolutionTime: 0
    }
  };

  return saveTicketDB(defaultData);
}

module.exports = {
  createTicket,
  closeTicket,
  claimTicket,
  unclaimTicket,
  transferTicket,
  addUserToTicket,
  removeUserFromTicket,
  setTicketPriority,
  getTicketByChannelId,
  getTicketById,
  getUserTickets,
  getTicketStats,
  getHandlerRankings,
  resetTicketData
};