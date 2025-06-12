import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { createReview, getUserReviews, getReviews, getReviewStats } from '../firebase/reviews.js';
import { CHANNEL_IDS } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('review')
  .setDescription('Make a review about your purchase experience')
  .addSubcommand(subcommand =>
    subcommand
      .setName('make')
      .setDescription('Create a new review')
      .addStringOption(option =>
        option.setName('rating')
          .setDescription('Your rating (1-5 stars)')
          .setRequired(true)
          .addChoices(
            { name: '⭐ 1 Star', value: '1' },
            { name: '⭐⭐ 2 Stars', value: '2' },
            { name: '⭐⭐⭐ 3 Stars', value: '3' },
            { name: '⭐⭐⭐⭐ 4 Stars', value: '4' },
            { name: '⭐⭐⭐⭐⭐ 5 Stars', value: '5' }
          ))
      .addStringOption(option =>
        option.setName('product')
          .setDescription('What product did you purchase?')
          .setRequired(true)
          .addChoices(
            { name: 'Premium Tweak App', value: 'premium_tweak' },
            { name: 'Premium Discord Bot', value: 'premium_bot' },
            { name: 'Premium API Access', value: 'premium_api' },
            { name: 'Other', value: 'other' }
          ))
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Brief title for your review')
          .setRequired(true)
          .setMaxLength(100))
      .addStringOption(option =>
        option.setName('comment')
          .setDescription('Your detailed review (optional)')
          .setRequired(false)
          .setMaxLength(1000)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('view')
      .setDescription('View reviews')
      .addStringOption(option =>
        option.setName('product')
          .setDescription('Filter by product')
          .setRequired(false)
          .addChoices(
            { name: 'All Products', value: 'all' },
            { name: 'Premium Tweak App', value: 'premium_tweak' },
            { name: 'Premium Discord Bot', value: 'premium_bot' },
            { name: 'Premium API Access', value: 'premium_api' },
            { name: 'Other', value: 'other' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('myreviews')
      .setDescription('View your own reviews'));

export async function execute(interaction, client) {
  try {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'make':
        await handleMakeReview(interaction);
        break;
      case 'view':
        await handleViewReviews(interaction);
        break;
      case 'myreviews':
        await handleMyReviews(interaction);
        break;
    }
  } catch (error) {
    console.error('Error in review command:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ **An error occurred while processing your request.**',
        flags: 64
      });
    } else if (interaction.deferred) {
      await interaction.editReply({
        content: '❌ **An error occurred while processing your request.**'
      });
    }
  }
}

// Helper function to log review activities to the specified channel
async function logReviewActivity(interaction, action, details = {}) {
  const logChannelId = CHANNEL_IDS.reviews;
  try {
    const logChannel = await interaction.guild.channels.fetch(logChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle(`📝 **Review Activity: ${action}**`)
        .setColor('#5865F2')
        .setDescription(`**User:** <@${interaction.user.id}> (${interaction.user.username})`)
        .addFields(
          { name: '🎯 **Action**', value: action, inline: true },
          { name: '👤 **User ID**', value: interaction.user.id, inline: true },
          { name: '📅 **Timestamp**', value: new Date().toLocaleString(), inline: true }
        )
        .setTimestamp();

      // Add specific details based on action
      if (details.rating) {
        logEmbed.addFields({ name: '⭐ **Rating**', value: '⭐'.repeat(details.rating), inline: true });
      }
      if (details.product) {
        logEmbed.addFields({ name: '📦 **Product**', value: getProductDisplayName(details.product), inline: true });
      }
      if (details.title) {
        logEmbed.addFields({ name: '📋 **Title**', value: details.title, inline: false });
      }
      if (details.reviewId) {
        logEmbed.addFields({ name: '🆔 **Review ID**', value: details.reviewId, inline: true });
      }

      await logChannel.send({ embeds: [logEmbed] });
    }
  } catch (error) {
    console.log('Could not log review activity to channel:', error.message);
  }
}

async function handleMakeReview(interaction) {
  // Check if user has the purchased role
  const member = interaction.member;
  const purchasedRoleId = '1382076356170354688';
  
  if (!member.roles.cache.has(purchasedRoleId)) {
    return await interaction.reply({
      content: '❌ **You need to purchase a product first to leave a review.**\n\n**How to get access:**\n• Purchase a premium subscription\n• Contact an admin to get the purchased role\n• Then you can leave reviews!',
      flags: 64
    });
  }

  const rating = interaction.options.getString('rating');
  const product = interaction.options.getString('product');
  const title = interaction.options.getString('title');
  const comment = interaction.options.getString('comment') || 'No additional comment provided.';

  await interaction.deferReply();

  try {
    const reviewId = await createReview({
      userId: interaction.user.id,
      username: interaction.user.username,
      rating: parseInt(rating),
      product: product,
      title: title,
      comment: comment,
      createdAt: new Date()
    });

    // Log the review creation
    await logReviewActivity(interaction, 'Review Created', {
      rating: parseInt(rating),
      product: product,
      title: title,
      reviewId: reviewId
    });

    const embed = new EmbedBuilder()
      .setTitle('📝 **Review Submitted Successfully!**')
      .setColor('#4CAF50')
      .setDescription(`**Thank you for your review!**`)
      .addFields(
        { name: '⭐ **Rating**', value: '⭐'.repeat(parseInt(rating)), inline: true },
        { name: '📦 **Product**', value: getProductDisplayName(product), inline: true },
        { name: '📋 **Title**', value: title, inline: false },
        { name: '💬 **Comment**', value: comment.length > 200 ? comment.substring(0, 200) + '...' : comment, inline: false },
        { name: '👤 **Reviewed By**', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🆔 **Review ID**', value: reviewId, inline: true }
      )
      .setTimestamp();

    // Create action buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('review_view_all')
          .setLabel('View All Reviews')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋'),
        new ButtonBuilder()
          .setCustomId('review_my_reviews')
          .setLabel('My Reviews')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👤')
      );

    await interaction.editReply({ embeds: [embed], components: [row] });

    // Send to review channel (optional)
    const reviewChannelId = CHANNEL_IDS.reviews;
    try {
      const reviewChannel = await interaction.guild.channels.fetch(reviewChannelId);
      if (reviewChannel) {
        const publicEmbed = new EmbedBuilder()
          .setTitle('⭐ **New Review Posted!**')
          .setColor('#FFD700')
          .setDescription(`**${title}**`)
          .addFields(
            { name: '⭐ **Rating**', value: '⭐'.repeat(parseInt(rating)), inline: true },
            { name: '📦 **Product**', value: getProductDisplayName(product), inline: true },
            { name: '👤 **By**', value: `<@${interaction.user.id}>`, inline: true },
            { name: '💬 **Review**', value: comment.length > 300 ? comment.substring(0, 300) + '...' : comment, inline: false }
          )
          .setTimestamp();

        await reviewChannel.send({ embeds: [publicEmbed] });
      }
    } catch (error) {
      console.log('Review channel not found or no permission to send messages');
    }

  } catch (error) {
    console.error('Error creating review:', error);
    await interaction.editReply({
      content: '❌ **Failed to submit review. Please try again.**'
    });
  }
}

async function handleViewReviews(interaction) {
  const product = interaction.options.getString('product') || 'all';

  await interaction.deferReply();

  try {
    // Log the review viewing activity
    await logReviewActivity(interaction, 'Reviews Viewed', {
      product: product
    });

    const reviews = await getReviews(product);
    
    if (reviews.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📝 **No Reviews Found**')
        .setColor('#FF9800')
        .setDescription(`**No reviews found for ${product === 'all' ? 'any product' : getProductDisplayName(product)}**\n\n**Be the first to leave a review!**`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📝 **Customer Reviews**')
      .setColor('#2196F3')
      .setDescription(`**Showing reviews for ${product === 'all' ? 'all products' : getProductDisplayName(product)}**`);

    // Show recent reviews (limit to 5)
    const recentReviews = reviews.slice(0, 5);
    const reviewList = recentReviews.map((review, index) => {
      const stars = '⭐'.repeat(review.rating);
      const date = review.createdAt.toDate().toLocaleDateString();
      return `${index + 1}. **${review.title}** ${stars}\n   *${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}*\n   — <@${review.userId}> • ${date}`;
    }).join('\n\n');

    embed.addFields({
      name: `📋 **Recent Reviews** (${recentReviews.length}/${reviews.length})`,
      value: reviewList,
      inline: false
    });

    // Add statistics
    const stats = calculateReviewStats(reviews);
    embed.addFields({
      name: '📊 **Statistics**',
      value: `**Average Rating:** ${stats.averageRating.toFixed(1)} ⭐\n**Total Reviews:** ${reviews.length}\n**5-Star Reviews:** ${stats.fiveStarCount}`,
      inline: false
    });

    embed.setTimestamp();

    // Create action buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('review_make')
          .setLabel('Write Review')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✍️'),
        new ButtonBuilder()
          .setCustomId('review_my_reviews')
          .setLabel('My Reviews')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('👤')
      );

    await interaction.editReply({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    await interaction.editReply({
      content: '❌ **Failed to fetch reviews. Please try again.**'
    });
  }
}

async function handleMyReviews(interaction) {
  await interaction.deferReply();

  try {
    // Log the my reviews activity
    await logReviewActivity(interaction, 'My Reviews Viewed');

    const userReviews = await getUserReviews(interaction.user.id);

    if (userReviews.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle('📝 **No Reviews Found**')
        .setColor('#FF9800')
        .setDescription(`**You haven't written any reviews yet.**\n\n**Write your first review using \`/review make\`!**`);

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('📝 **Your Reviews**')
      .setColor('#9C27B0')
      .setDescription(`**You have written ${userReviews.length} review(s)**`);

    // Show user's reviews
    const reviewList = userReviews.map((review, index) => {
      const stars = '⭐'.repeat(review.rating);
      const date = review.createdAt.toDate().toLocaleDateString();
      return `${index + 1}. **${review.title}** ${stars}\n   **Product:** ${getProductDisplayName(review.product)}\n   *${review.comment.substring(0, 150)}${review.comment.length > 150 ? '...' : ''}*\n   • ${date}`;
    }).join('\n\n');

    embed.addFields({
      name: '📋 **Your Reviews**',
      value: reviewList,
      inline: false
    });

    embed.setTimestamp();

    // Create action buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('review_make')
          .setLabel('Write New Review')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✍️'),
        new ButtonBuilder()
          .setCustomId('review_view_all')
          .setLabel('View All Reviews')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('📋')
      );

    await interaction.editReply({ embeds: [embed], components: [row] });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    await interaction.editReply({
      content: '❌ **Failed to fetch your reviews. Please try again.**'
    });
  }
}

// Handle button interactions for review command
export async function handleReviewButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'review_make') {
    await handleMakeReview(interaction);
  } else if (customId === 'review_view_all') {
    await handleViewReviews(interaction);
  } else if (customId === 'review_my_reviews') {
    await handleMyReviews(interaction);
  }
}

function getProductDisplayName(product) {
  const productNames = {
    'premium_tweak': 'Premium Tweak App',
    'premium_bot': 'Premium Discord Bot',
    'premium_api': 'Premium API Access',
    'other': 'Other Product'
  };
  return productNames[product] || product;
}

function calculateReviewStats(reviews) {
  if (reviews.length === 0) {
    return { averageRating: 0, fiveStarCount: 0 };
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  const fiveStarCount = reviews.filter(review => review.rating === 5).length;

  return { averageRating, fiveStarCount };
} 