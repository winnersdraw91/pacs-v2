import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { 
  ArrowRightOnRectangleIcon, 
  UserIcon, 
  CogIcon 
} from '@heroicons/react/24/outline';
import { fadeIn, slideIn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <motion.header 
        className="backdrop-blur-md bg-white/80 border-b border-white/20 px-6 py-4 shadow-glass"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-4"
            variants={slideIn}
            initial="initial"
            animate="animate"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-modern rounded-lg flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-modern bg-clip-text text-transparent">
                  PACS System
                </h1>
                <span className="text-sm text-gray-600 capitalize">
                  {user?.role?.replace('_', ' ')} Portal
                </span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-4"
            variants={fadeIn}
            initial="initial"
            animate="animate"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" size="sm" className="backdrop-blur-sm hover:bg-white/20">
                    <UserIcon className="mr-2 h-4 w-4" />
                    {user?.full_name || user?.username}
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="backdrop-blur-md bg-white/90 border border-white/20"
              >
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <CogIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        </div>
      </motion.header>
      
      <motion.main 
        className="container mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children}
      </motion.main>
    </div>
  );
};
