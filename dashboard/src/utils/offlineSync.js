import { createClient } from '@supabase/supabase-js';
import { setupOfflineSync, queueOfflineAction, isOnline } from './storage';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function syncAction(action) {
  const online = await isOnline();

  if (!online) {
    await queueOfflineAction(action.type, action.data);
    return { success: false, queued: true };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    switch (action.type) {
      case 'CREATE_PROJECT':
        return await syncCreateProject(action.data, user.id);

      case 'UPDATE_PROJECT':
        return await syncUpdateProject(action.data, user.id);

      case 'DELETE_PROJECT':
        return await syncDeleteProject(action.data, user.id);

      case 'SAVE_FILE':
        return await syncSaveFile(action.data, user.id);

      case 'DELETE_FILE':
        return await syncDeleteFile(action.data, user.id);

      case 'SAVE_CHAT_MESSAGE':
        return await syncChatMessage(action.data, user.id);

      case 'CREATE_MEMORY':
        return await syncMemory(action.data, user.id);

      default:
        console.warn(`Unknown action type: ${action.type}`);
        return { success: false, error: 'Unknown action type' };
    }
  } catch (error) {
    console.error(`Error syncing action ${action.type}:`, error);
    return { success: false, error: error.message };
  }
}

async function syncCreateProject(data, userId) {
  const { error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description,
      template: data.template,
      repository_url: data.repository_url,
      status: 'active'
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncUpdateProject(data, userId) {
  const { error } = await supabase
    .from('projects')
    .update({
      name: data.name,
      description: data.description,
      template: data.template,
      repository_url: data.repository_url
    })
    .eq('id', data.projectId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncDeleteProject(data, userId) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', data.projectId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncSaveFile(data, userId) {
  await supabase
    .from('project_files')
    .delete()
    .eq('project_id', data.projectId)
    .eq('file_name', data.fileName)
    .eq('user_id', userId);

  const { error } = await supabase
    .from('project_files')
    .insert({
      project_id: data.projectId,
      user_id: userId,
      file_name: data.fileName,
      file_path: data.filePath || `/${data.fileName}`,
      content: data.content,
      language: data.language
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncDeleteFile(data, userId) {
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('project_id', data.projectId)
    .eq('file_name', data.fileName)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncChatMessage(data, userId) {
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      role: data.role,
      content: data.content,
      code: data.code || null,
      files: data.files || null
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function syncMemory(data, userId) {
  const { error } = await supabase
    .from('ai_memories')
    .insert({
      user_id: userId,
      project_id: data.projectId || null,
      memory_type: data.type,
      context: data.context,
      content: { text: data.content },
      confidence: data.confidence || 0.8,
      access_count: 0
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function initializeOfflineSync() {
  return setupOfflineSync(syncAction);
}
