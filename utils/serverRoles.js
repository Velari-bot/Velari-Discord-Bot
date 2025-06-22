import { db } from '../firebase/firebase.js';

/**
 * Get server configuration from Firebase
 * @param {string} guildId - The Discord guild ID
 * @returns {Promise<Object|null>} - Server configuration or null if not found
 */
export async function getServerConfig(guildId) {
  try {
    const doc = await db.collection('server_configs').doc(guildId).get();
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('Error getting server config:', error);
    return null;
  }
}

/**
 * Check if a member has admin permissions for this server
 * @param {GuildMember} member - The guild member to check
 * @returns {Promise<boolean>} - Whether the member has admin permissions
 */
export async function hasAdminPermission(member) {
  try {
    const serverConfig = await getServerConfig(member.guild.id);
    if (!serverConfig || !serverConfig.isActive) {
      return false;
    }

    return member.roles.cache.has(serverConfig.adminRoleId);
  } catch (error) {
    console.error('Error checking admin permission:', error);
    return false;
  }
}

/**
 * Check if a member has staff permissions for this server
 * @param {GuildMember} member - The guild member to check
 * @returns {Promise<boolean>} - Whether the member has staff permissions
 */
export async function hasStaffPermission(member) {
  try {
    const serverConfig = await getServerConfig(member.guild.id);
    if (!serverConfig || !serverConfig.isActive) {
      return false;
    }

    return member.roles.cache.has(serverConfig.adminRoleId) || 
           member.roles.cache.has(serverConfig.staffRoleId);
  } catch (error) {
    console.error('Error checking staff permission:', error);
    return false;
  }
}

/**
 * Check if a member has support permissions for this server
 * @param {GuildMember} member - The guild member to check
 * @returns {Promise<boolean>} - Whether the member has support permissions
 */
export async function hasSupportPermission(member) {
  try {
    const serverConfig = await getServerConfig(member.guild.id);
    if (!serverConfig || !serverConfig.isActive) {
      return false;
    }

    return member.roles.cache.has(serverConfig.adminRoleId) || 
           member.roles.cache.has(serverConfig.staffRoleId) ||
           (serverConfig.supportRoleId && member.roles.cache.has(serverConfig.supportRoleId));
  } catch (error) {
    console.error('Error checking support permission:', error);
    return false;
  }
}

/**
 * Get the support role for a server
 * @param {Guild} guild - The Discord guild
 * @returns {Promise<Role|null>} - The support role or null if not found
 */
export async function getSupportRole(guild) {
  try {
    const serverConfig = await getServerConfig(guild.id);
    if (!serverConfig || !serverConfig.isActive || !serverConfig.supportRoleId) {
      return null;
    }

    return guild.roles.cache.get(serverConfig.supportRoleId);
  } catch (error) {
    console.error('Error getting support role:', error);
    return null;
  }
}

/**
 * Check if a server has been configured
 * @param {string} guildId - The Discord guild ID
 * @returns {Promise<boolean>} - Whether the server has been configured
 */
export async function isServerConfigured(guildId) {
  try {
    const serverConfig = await getServerConfig(guildId);
    return serverConfig && serverConfig.isActive;
  } catch (error) {
    console.error('Error checking server configuration:', error);
    return false;
  }
}

/**
 * Get all role IDs for a server (for backward compatibility)
 * @param {string} guildId - The Discord guild ID
 * @returns {Promise<Object>} - Object with admin, staff, and support role IDs
 */
export async function getServerRoleIds(guildId) {
  try {
    const serverConfig = await getServerConfig(guildId);
    if (!serverConfig || !serverConfig.isActive) {
      return {
        adminRoleId: null,
        staffRoleId: null,
        supportRoleId: null
      };
    }

    return {
      adminRoleId: serverConfig.adminRoleId,
      staffRoleId: serverConfig.staffRoleId,
      supportRoleId: serverConfig.supportRoleId
    };
  } catch (error) {
    console.error('Error getting server role IDs:', error);
    return {
      adminRoleId: null,
      staffRoleId: null,
      supportRoleId: null
    };
  }
} 