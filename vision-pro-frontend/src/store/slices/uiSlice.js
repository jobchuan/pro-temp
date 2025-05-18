// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarCollapsed: false,
    activeMenu: null,
    modalVisible: false,
    modalType: null,
    modalProps: {},
    loading: false,
    loadingMessage: '',
    contextPanel: {
      visible: false,
      type: null,
      data: null
    }
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload
    },
    setActiveMenu: (state, action) => {
      state.activeMenu = action.payload
    },
    openModal: (state, action) => {
      state.modalVisible = true
      state.modalType = action.payload.type
      state.modalProps = action.payload.props || {}
    },
    closeModal: (state) => {
      state.modalVisible = false
      state.modalType = null
      state.modalProps = {}
    },
    setLoading: (state, action) => {
      state.loading = action.payload.status
      state.loadingMessage = action.payload.message || ''
    },
    openContextPanel: (state, action) => {
      state.contextPanel.visible = true
      state.contextPanel.type = action.payload.type
      state.contextPanel.data = action.payload.data || null
    },
    closeContextPanel: (state) => {
      state.contextPanel.visible = false
    },
    updateContextPanelData: (state, action) => {
      if (state.contextPanel.visible) {
        state.contextPanel.data = action.payload
      }
    }
  }
})

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setActiveMenu,
  openModal,
  closeModal,
  setLoading,
  openContextPanel,
  closeContextPanel,
  updateContextPanelData
} = uiSlice.actions

export default uiSlice.reducer
