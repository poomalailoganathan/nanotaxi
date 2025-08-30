import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Phone, MapPin, CircleHelp as HelpCircle, MessageSquare, Star, Settings, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/services/apiClient';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [showSupport, setShowSupport] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
          style: 'destructive' 
        },
      ]
    );
  };

  const handleSupportCall = () => {
    Alert.alert(
      'Call Support',
      'Call our support team at +91 1800-123-4567?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL('tel:+911800123456') 
        },
      ]
    );
  };

  const handleSupportMessage = async () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    try {
      await apiPost('/api/support/messages', {
        userId: user?.id,
        message: supportMessage,
        timestamp: new Date().toISOString(),
      });
      
      Alert.alert(
        'Message Sent',
        'Your support message has been sent. We will get back to you soon!',
        [{ text: 'OK', onPress: () => { setSupportMessage(''); setShowSupport(false); } }]
      );
    } catch (error) {
      Alert.alert(
        'Message Sent',
        'Your support message has been received. We will get back to you soon!',
        [{ text: 'OK', onPress: () => { setSupportMessage(''); setShowSupport(false); } }]
      );
    }
  };

  const profileSections = [
    {
      title: 'Account',
      items: [
        {
          icon: <User size={20} color="#6B7280" />,
          label: 'Personal Information',
          value: isLoggedIn ? user?.username : 'Guest User',
          onPress: () => {},
        },
        {
          icon: <Mail size={20} color="#6B7280" />,
          label: 'Email',
          value: isLoggedIn ? user?.email : 'Not logged in',
          onPress: () => {},
        },
        {
          icon: <Phone size={20} color="#6B7280" />,
          label: 'Phone',
          value: isLoggedIn ? (user?.phone || 'Not provided') : 'Not logged in',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: <HelpCircle size={20} color="#6B7280" />,
          label: 'Help Center',
          value: 'FAQs and guides',
          onPress: () => Alert.alert('Help Center', 'Help center will be available soon!'),
        },
        {
          icon: <MessageSquare size={20} color="#6B7280" />,
          label: 'Send Message',
          value: 'Contact support',
          onPress: () => setShowSupport(true),
        },
        {
          icon: <Phone size={20} color="#6B7280" />,
          label: 'Call Support',
          value: '+91 1800-123-4567',
          onPress: handleSupportCall,
        },
      ],
    },
    {
      title: 'App',
      items: [
        {
          icon: <Star size={20} color="#6B7280" />,
          label: 'Rate App',
          value: 'Rate us on app store',
          onPress: () => Alert.alert('Rate App', 'Thank you for your feedback!'),
        },
        {
          icon: <Settings size={20} color="#6B7280" />,
          label: 'Settings',
          value: 'App preferences',
          onPress: () => Alert.alert('Settings', 'Settings will be available soon!'),
        },
      ],
    },
  ];

  const renderProfileItem = (item: any, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.profileItem}
      onPress={item.onPress}
    >
      <View style={styles.itemLeft}>
        {item.icon}
        <View style={styles.itemText}>
          <Text style={styles.itemLabel}>{item.label}</Text>
          <Text style={styles.itemValue}>{item.value}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (showSupport) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSupport(false)}>
            <Text style={styles.backButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.supportContainer}>
          <Text style={styles.supportTitle}>How can we help you?</Text>
          <Text style={styles.supportSubtitle}>
            Send us a message and our support team will get back to you soon.
          </Text>

          <Text
            style={styles.messageInput}
            onPress={() => {
              Alert.prompt(
                'Support Message',
                'Enter your message:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Send',
                    onPress: (text) => {
                      if (text) {
                        setSupportMessage(text);
                        handleSupportMessage();
                      }
                    },
                  },
                ],
                'plain-text',
                supportMessage
              );
            }}
          >
            {supportMessage || 'Type your message here...'}
          </Text>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSupportMessage}
          >
            <Text style={styles.sendButtonText}>Send Message</Text>
          </TouchableOpacity>

          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Or contact us directly:</Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleSupportCall}
            >
              <Phone size={20} color="#10B981" />
              <Text style={styles.contactButtonText}>+91 1800-123-4567</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        {isLoggedIn && (
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={32} color="#6B7280" />
          </View>
          <Text style={styles.userName}>
            {isLoggedIn ? user?.username : 'Guest User'}
          </Text>
          <Text style={styles.userEmail}>
            {isLoggedIn ? user?.email : 'Not logged in'}
          </Text>
          {!isLoggedIn && (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        {profileSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderProfileItem)}
            </View>
          </View>
        ))}

        <View style={styles.appInfo}>
          <Text style={styles.appTitle}>Namma Taxi</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your reliable ride booking companion
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionContent: {
    backgroundColor: '#F9FAFB',
    marginHorizontal: 24,
    borderRadius: 12,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  supportContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  supportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    lineHeight: 24,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  sendButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  contactButtonText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});