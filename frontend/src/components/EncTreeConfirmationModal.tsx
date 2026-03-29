import { AlertDialog, Button, Flex, Separator, Text } from '@radix-ui/themes';
import React from 'react';

type props = {
  nextStep: () => void
}

const EncTreeConfirmationModal: React.FC<props> = ({ nextStep }: props) => {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger>
        <Button>Encrypt my notes</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px" className="vt32">
        <AlertDialog.Title color="orange" style={{fontFamily: "vt32"}}>Important</AlertDialog.Title>
        <AlertDialog.Description size="2">
          <Text>Your note will be securely encrypted for extra privacy at the next step.</Text>
          <br/>
          <Text>We recommend backing up your files.</Text>
          {/* <Separator my="3" size="4" /> */}
          {/* <Text>Learn more <a href="https://github.com/results-may-vary-org/tape/blob/main/README.md" rel="noreferrer">here</a>.</Text> */}
        </AlertDialog.Description>
        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="orange">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button variant="solid" color="green" onClick={nextStep}>
              Continue
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
};

export default EncTreeConfirmationModal;
