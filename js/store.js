import { database } from './firebase-config.js';
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// Global State
export const state = {
    allTasks: {},
    allUsers: {},
    currentUser: null,
};

// Observers pattern to notify other modules when data changes
const taskListeners = [];
const userListeners = [];

export function onTasksChanged(callback) {
    taskListeners.push(callback);
}

export function onUsersChanged(callback) {
    userListeners.push(callback);
}

function notifyTaskListeners() {
    taskListeners.forEach(cb => cb(state.allTasks));
}

function notifyUserListeners() {
    userListeners.forEach(cb => cb(state.allUsers));
}

// Data Fetching
export function initStore(currentUserObj) {
    state.currentUser = currentUserObj;

    // Set up a single listener for tasks
    const tasksRef = ref(database, 'tasks');
    onValue(tasksRef, (snapshot) => {
        state.allTasks = snapshot.val() || {};
        notifyTaskListeners();
    });

    // Fetch users (or listen)
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        state.allUsers = snapshot.val() || {};
        notifyUserListeners();
    });
}

// Getters
export function getAllTasks() {
    return state.allTasks;
}

export function getAllUsers() {
    return state.allUsers;
}

export function getCurrentUser() {
    return state.currentUser;
}

export function setCurrentUser(user) {
    state.currentUser = user;
}
