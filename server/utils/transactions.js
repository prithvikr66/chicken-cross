export async function validateTransaction(tx, params) {
    try {
      if (!tx.meta?.postBalances) {
        return false;
      }
     
      const instructions = tx.transaction.message.instructions;
      const accountKeys = tx.transaction.message.accountKeys;
  
      if (!instructions || instructions.length === 0 || !accountKeys) {
        console.log('No instructions or account keys found');
        return false;
      }
  
      
      
      const transferInstruction = instructions.find(instruction => 
        instruction.accounts && 
        instruction.accounts.length >= 2
      );
  
      if (!transferInstruction) {
        console.log('No valid transfer instruction found');
        return false;
      }
  
      // Get the actual addresses using the account indices
      const fromAddress = accountKeys[transferInstruction.accounts[0]].toString();
      const toAddress = accountKeys[transferInstruction.accounts[1]].toString();
  
      if (
        fromAddress !== params.senderWallet ||
        toAddress !== params.masterWallet
      ) {
        return false;
      }
      const transferAmountLamports = tx.meta.postBalances[1] - tx.meta.preBalances[1];
      const transferAmountSOL = transferAmountLamports / 1000000000; 
      if (transferAmountSOL !== params.amount) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Transaction validation error:', error);
      console.error('Transaction data:', JSON.stringify(tx, null, 2));
      return false;
    }
  }