import React from 'react';
import { motion } from 'framer-motion';
import { User, ShoppingCart, Shield, ArrowRight } from 'lucide-react';

const RoleSelection = ({ selectedRole, onRoleSelect, onNext }) => {
  const roles = [
    {
      id: 'project_developer',
      title: 'Project Developer',
      description: 'Create and manage carbon offset projects',
      icon: User,
      features: [
        'Register carbon offset projects',
        'Upload MRV data and documentation',
        'Claim verified carbon credits',
        'Track project performance'
      ],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'credit_buyer',
      title: 'Credit Buyer',
      description: 'Purchase carbon credits for offsetting emissions',
      icon: ShoppingCart,
      features: [
        'Browse verified carbon credits',
        'Purchase credits from marketplace',
        'Retire credits for offsetting',
        'Track carbon footprint reduction'
      ],
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'regulatory_body',
      title: 'Regulatory Body',
      description: 'Verify and audit carbon projects',
      icon: Shield,
      features: [
        'Review project submissions',
        'Conduct verification audits',
        'Approve or reject projects',
        'Schedule on-site inspections'
      ],
      color: 'from-purple-500 to-indigo-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Role</h2>
        <p className="text-gray-600">Select the role that best describes your organization</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;
          
          return (
            <motion.div
              key={role.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                isSelected 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => onRoleSelect(role.id)}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${role.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{role.title}</h3>
                    <p className="text-gray-600 mb-4">{role.description}</p>
                    
                    <ul className="space-y-1">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isSelected && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedRole && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Continue as {roles.find(r => r.id === selectedRole)?.title}
          <ArrowRight className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
};

export default RoleSelection;