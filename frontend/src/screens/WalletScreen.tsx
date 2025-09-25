import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function WalletScreen() {
  const [activeTab, setActiveTab] = useState('Transactions');
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const transactions = [
    {
      id: 1,
      date: 'Today, 2:30 PM',
      description: 'Ride payment from Emily W.',
      amount: 15.75,
      type: 'incoming',
    },
    {
      id: 2,
      date: 'Today, 11:15 AM',
      description: 'Ride payment from Michael T.',
      amount: 22.50,
      type: 'incoming',
    },
    {
      id: 3,
      date: 'Yesterday, 5:45 PM',
      description: 'Ride payment from Sarah J.',
      amount: 18.25,
      type: 'incoming',
    },
    {
      id: 4,
      date: 'Yesterday, 3:20 PM',
      description: 'Withdrawal to Bank Account (****2345)',
      amount: 50.00,
      type: 'outgoing',
    },
    {
      id: 5,
      date: '2 days ago, 8:15 AM',
      description: 'Ride payment from Robert L.',
      amount: 32.00,
      type: 'incoming',
    },
  ];

  const paymentMethods = [
    {
      id: 1,
      type: 'Bank Account',
      number: '****2345',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Debit Card',
      number: '****5678',
      isDefault: false,
    },
  ];

  const renderTransactions = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transactions</Text>
        <TouchableOpacity>
          <MaterialIcons name="tune" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      {transactions.map((transaction) => (
        <Card key={transaction.id} style={styles.transactionCard}>
          <Card.Content style={styles.transactionContent}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.type === 'incoming' ? '#4CAF50' : '#F44336' }
              ]}>
                {transaction.type === 'incoming' ? '↓' : '↑'} ${transaction.amount.toFixed(2)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );

  const renderEarnings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Earnings Overview</Text>
      
      <View style={styles.periodSelector}>
        <Text style={styles.periodLabel}>Select period</Text>
        <View style={styles.periodTabs}>
          {['Day', 'Week', 'Month'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodTab,
                selectedPeriod === period && styles.periodTabActive
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[
                styles.periodTabText,
                selectedPeriod === period && styles.periodTabTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Card style={styles.chartCard}>
        <Card.Content style={styles.chartContent}>
          <View style={styles.chartBars}>
            <View style={[styles.chartBar, { height: 20 }]} />
            <View style={[styles.chartBar, { height: 40 }]} />
            <View style={[styles.chartBar, { height: 60 }]} />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.earningsSummary}>
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryValue}>$238.75</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryLabel}>Rides Completed</Text>
            <Text style={styles.summaryValue}>18</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.downloadSection}>
        <View style={styles.downloadHeader}>
          <Text style={styles.sectionTitle}>Download Reports</Text>
          <MaterialIcons name="calendar-today" size={20} color="#666" />
        </View>
        
        <Card style={styles.downloadCard}>
          <Card.Content style={styles.downloadContent}>
            <Text style={styles.downloadText}>Weekly Summary</Text>
            <MaterialIcons name="file-download" size={20} color="#666" />
          </Card.Content>
        </Card>
      </View>
    </View>
  );

  const renderPayouts = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      
      {paymentMethods.map((method) => (
        <Card key={method.id} style={styles.paymentMethodCard}>
          <Card.Content style={styles.paymentMethodContent}>
            <View style={styles.paymentMethodLeft}>
              <MaterialIcons 
                name={method.type === 'Bank Account' ? 'account-balance' : 'credit-card'} 
                size={20} 
                color="#666" 
              />
              <View style={styles.paymentMethodInfo}>
                <Text style={styles.paymentMethodType}>{method.type}</Text>
                <Text style={styles.paymentMethodNumber}>{method.number}</Text>
              </View>
            </View>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      ))}

      <TouchableOpacity style={styles.addPaymentButton}>
        <Card style={styles.addPaymentCard}>
          <Card.Content style={styles.addPaymentContent}>
            <MaterialIcons name="add" size={20} color="#333" />
            <Text style={styles.addPaymentText}>Add Payment Method</Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      <View style={styles.withdrawSection}>
        <Text style={styles.sectionTitle}>Withdraw Funds</Text>
        
        <Card style={styles.withdrawCard}>
          <Card.Content>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="$ 0.00"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To</Text>
              <View style={styles.dropdown}>
                <Text style={styles.dropdownText}>Bank Account (****2345)</Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
              </View>
            </View>
            
            <Button
              mode="contained"
              style={styles.withdrawButton}
              labelStyle={styles.withdrawButtonText}
            >
              Withdraw
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <LinearGradient
        colors={['#1a1a1a', '#2a2a2a']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Wallet</Text>
          <MaterialIcons name="account-balance-wallet" size={24} color="#fff" />
        </View>
        
        <Card style={styles.balanceCard}>
          <Card.Content>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>$238.75</Text>
            <Button
              mode="contained"
              style={styles.withdrawFundsButton}
              labelStyle={styles.withdrawFundsText}
            >
              Withdraw Funds
            </Button>
          </Card.Content>
        </Card>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {['Transactions', 'Earnings', 'Payouts'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Transactions' && renderTransactions()}
        {activeTab === 'Earnings' && renderEarnings()}
        {activeTab === 'Payouts' && renderPayouts()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  withdrawFundsButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    alignSelf: 'center',
  },
  withdrawFundsText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabContent: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  transactionCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 10,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  periodSelector: {
    marginBottom: 20,
  },
  periodLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: '#000000',
  },
  periodTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodTabTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 20,
  },
  chartContent: {
    padding: 20,
    height: 120,
    justifyContent: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 60,
  },
  chartBar: {
    width: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  earningsSummary: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  downloadSection: {
    marginBottom: 20,
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  downloadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  downloadContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  downloadText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  paymentMethodCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 15,
  },
  paymentMethodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodInfo: {
    marginLeft: 12,
  },
  paymentMethodType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  paymentMethodNumber: {
    fontSize: 14,
    color: '#666',
  },
  defaultBadge: {
    backgroundColor: '#666',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  addPaymentButton: {
    marginBottom: 20,
  },
  addPaymentCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  addPaymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  addPaymentText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  withdrawSection: {
    marginBottom: 20,
  },
  withdrawCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  withdrawButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 4,
  },
  withdrawButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
