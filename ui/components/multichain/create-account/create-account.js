import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  ButtonPrimary,
  ButtonSecondary,
  FormTextField,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getAccountNameErrorMessage } from '../../../helpers/utils/accounts';
import {
  getMetaMaskAccountsOrdered,
  getMetaMaskIdentities,
} from '../../../selectors';
import { addNewAccount, setAccountLabel } from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import Box from '../../ui/box/box';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { Display } from '../../../helpers/constants/design-system';

export const CreateAccount = ({ onActionComplete }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();

  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const identities = useSelector(getMetaMaskIdentities);
  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);

  const newAccountNumber = Object.keys(identities).length + 1;
  const defaultAccountName = t('newAccountNumberName', [newAccountNumber]);

  const [newAccountName, setNewAccountName] = useState('');

  const { isValidAccountName, errorMessage } = getAccountNameErrorMessage(
    accounts,
    { t },
    newAccountName,
    defaultAccountName,
  );

  const onCreateAccount = async (name) => {
    const newAccountAddress = await dispatch(addNewAccount());
    if (name) {
      dispatch(setAccountLabel(newAccountAddress, name));
    }
  };

  return (
    <Box
      as="form"
      onSubmit={async (event) => {
        event.preventDefault();

        try {
          await onCreateAccount(newAccountName || defaultAccountName);
          onActionComplete(true);
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAdded,
            properties: {
              account_type: MetaMetricsEventAccountType.Default,
              location: 'Home',
            },
          });
          history.push(mostRecentOverviewPage);
        } catch (error) {
          trackEvent({
            category: MetaMetricsEventCategory.Accounts,
            event: MetaMetricsEventName.AccountAddFailed,
            properties: {
              account_type: MetaMetricsEventAccountType.Default,
              error: error.message,
            },
          });
        }
      }}
    >
      <FormTextField
        autoFocus
        label={t('accountName')}
        placeholder={defaultAccountName}
        onChange={(event) => setNewAccountName(event.target.value)}
        helpText={errorMessage}
        error={!isValidAccountName}
      />
      <Box display={Display.Flex} marginTop={6} gap={2}>
        <ButtonSecondary onClick={() => onActionComplete()} block>
          {t('cancel')}
        </ButtonSecondary>
        <ButtonPrimary type="submit" disabled={!isValidAccountName} block>
          {t('create')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

CreateAccount.propTypes = {
  onActionComplete: PropTypes.func.isRequired,
};
