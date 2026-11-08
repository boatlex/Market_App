import React, { useState } from 'react';
import { Alert } from 'react-native';
import Dialog from 'react-native-dialog';

interface OfferDialogProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}

const OfferDialog: React.FC<OfferDialogProps> = ({ visible, onClose, onSubmit }) => {
  const [offerAmount, setOfferAmount] = useState<string>("");

  const handleSubmit = () => {
    if (!offerAmount || isNaN(Number(offerAmount))) {
      Alert.alert("Error", "Please enter a valid numeric value.");
      return;
    }
    
    onSubmit(Number(offerAmount));
    setOfferAmount(""); // Clear input field for next opening
  };

  const handleCancel = () => {
    setOfferAmount("");
    onClose();
  };

  return (
    <Dialog.Container visible={visible} onBackdropPress={handleCancel}>
      <Dialog.Title>Make an Offer</Dialog.Title>
      <Dialog.Description>Enter your negotiation offer amount in GHS:</Dialog.Description>
      <Dialog.Input 
        keyboardType="numeric" 
        value={offerAmount} 
        onChangeText={(text: string) => setOfferAmount(text)} 
        placeholder="e.g. 150"
      />
      <Dialog.Button label="Cancel" color="#666" onPress={handleCancel} />
      <Dialog.Button label="Submit" bold color="#007AFF" onPress={handleSubmit} />
    </Dialog.Container>
  );
};

export default OfferDialog;
