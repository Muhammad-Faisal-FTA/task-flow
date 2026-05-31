// hooks/useAuthenticatedApp.ts
// Combined hook that provides both authentication and API-integrated app state

"use client";
import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppApiClient } from "@/hooks/useAppApiClient";

/**
 * Combined hook that provides:
 * - Authentication state and actions (from useAuth)
 * - App state with API integration (from useAppApiClient)
 * 
 * This is the main hook to use in the application for a fully integrated experience.
 */
export function useAuthenticatedApp() {
  const auth = useAuth();
  
  // Create the API client with the auth token getter
  const appClient = useAppApiClient(auth.getAccessToken);
  
  // Memoize the combined state to prevent unnecessary re-renders
  const state = useMemo(() => ({
    // Auth state
    user: auth.user,
    accessToken: auth.accessToken,
    isLoading: auth.isLoading,
    isAuthenticated: auth.isAuthenticated,
    
    // App state
    screen: appClient.screen,
    tasks: appClient.tasks,
    allTasks: appClient.allTasks,
    lists: appClient.lists,
    filterListId: appClient.filterListId,
    setFilterListId: appClient.setFilterListId,
    selectedTask: appClient.selectedTask,
    setSelectedTask: appClient.setSelectedTask,
    toast: appClient.toast,
    isLoadingData: appClient.isLoading,
    error: appClient.error,
    updateList: appClient.updateList,
    undoTask:   appClient.undoTask,
    undoDelete: appClient.undoDelete,
    // Auth actions
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    forgotPassword: auth.forgotPassword,
    resetPassword: auth.resetPassword,
    verifyEmail: auth.verifyEmail,
    
    // App actions
    navigate: appClient.navigate,
    goBack: appClient.goBack,
    openTask: appClient.openTask,
    openNewTask: appClient.openNewTask,
    saveTask: appClient.saveTask,
    deleteTask: appClient.deleteTask,
    toggleComplete: appClient.toggleComplete,
    addList: appClient.addList,
    deleteList: appClient.deleteList,
    showToast: appClient.showToast,
    
    // Data fetching
    fetchTasks: appClient.fetchTasks,
    fetchLists: appClient.fetchLists,
    refreshAll: appClient.refreshAll,
  }), [auth, appClient]);
  
  return state;
}

export type AuthenticatedAppState = ReturnType<typeof useAuthenticatedApp>;