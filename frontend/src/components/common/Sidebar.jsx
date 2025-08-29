import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  FileText,
  Award,
  ShoppingCart,
  TrendingUp,
  Settings,
  Users,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getMenuItems = () => {
    const baseItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }
    ];

            switch (user?.role) {
      case 'project_developer':
        return [
          ...baseItems,
          { icon: FileText, label: 'My Projects', path: '/projects' },
          { icon: Award, label: 'Carbon Credits', path: '/credits' },
          { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
          { icon: Settings, label: 'Settings', path: '/settings' }
        ];
      
      case 'credit_buyer':
        return [
          ...baseItems,
          { icon: ShoppingCart, label: 'Marketplace', path: '/marketplace' },
          { icon: Award, label: 'My Credits', path: '/my-credits' },
          { icon: BarChart3, label: 'Portfolio', path: '/portfolio' },
          { icon: Settings, label: 'Settings', path: '/settings' }
        ];
      
      case 'regulatory_body':
        return [
          ...baseItems,
          { icon: Clock, label: 'Pending Reviews', path: '/pending' },
          { icon: CheckCircle, label: 'Approved Projects', path: '/approved' },
          { icon: Users, label: 'Inspections', path: '/inspections' },
          { icon: BarChart3, label: 'Reports', path: '/reports' },
          { icon: Settings, label: 'Settings', path: '/settings' }
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 lg:translate-x-0 lg:static lg:shadow-none"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">
            {user?.role?.replace('_', ' ')} Panel
          </h2>
        </div>

        <nav className="mt-6">
          <div className="px-3">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.path);

              return (
                <Link
                  key={index}
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.organization}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;