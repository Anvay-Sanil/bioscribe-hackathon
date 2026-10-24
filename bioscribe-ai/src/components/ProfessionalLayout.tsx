"use client";

import { useState } from "react";
import {
  Home,
  Beaker,
  Database,
  FileText,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  HelpCircle,
  Zap,
  ChevronRight,
  Sparkles,
  Activity
} from "lucide-react";

interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

export function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: "Pipeline Complete", message: "HIV-1 Protease analysis finished", time: "2 min ago", unread: true },
    { id: 2, title: "New Drug Candidates", message: "247 candidates generated", time: "15 min ago", unread: true },
    { id: 3, title: "System Update", message: "New AI models available", time: "1 hour ago", unread: false }
  ];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Top Navigation Bar - Enhanced */}
      <header className="h-16 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50 to-purple-50 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-8">
          {/* Logo - Enhanced */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">B</span>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BioScribe</span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Sparkles className="w-3 h-3" />
                <span>Enterprise</span>
              </div>
            </div>
          </div>

          {/* Main Navigation - Enhanced */}
          <nav className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm hover:shadow-md transition-all">
              <Zap className="w-4 h-4 inline mr-2" />
              Workflows
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-lg transition-all">
              Projects
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-lg transition-all">
              Data
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-lg transition-all">
              Reports
            </button>
          </nav>
        </div>

        {/* Right Side - Enhanced */}
        <div className="flex items-center gap-4">
          {/* Search - Enhanced */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search proteins, experiments..."
              className="w-72 h-10 pl-10 pr-4 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white/80 backdrop-blur-sm"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>

          {/* Activity Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>API Active</span>
          </div>

          {/* Notifications - Enhanced */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-white/50 rounded-lg transition-all"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">{notifications.filter(n => n.unread).length} unread</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all ${notif.unread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{notif.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                        {notif.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu - Enhanced */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-4 border-l-2 border-gray-200 hover:bg-white/50 rounded-r-lg pr-2 py-1 transition-all"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-bold text-white">DS</span>
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-semibold text-gray-900">Dr. Sanil</div>
                <div className="text-xs text-gray-500">Lead Researcher</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-white">DS</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Dr. Sanil</div>
                      <div className="text-xs text-gray-500">sanil@lab.com</div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
                    <User className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all">
                    <HelpCircle className="w-4 h-4" />
                    <span>Help & Support</span>
                  </button>
                </div>
                <div className="p-2 border-t border-gray-200">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-gray-400" />
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">Workflows</span>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-gray-900">Drug Discovery Pipeline</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        ></div>
      )}
    </div>
  );
}
