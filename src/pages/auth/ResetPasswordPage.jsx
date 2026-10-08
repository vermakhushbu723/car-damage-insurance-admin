import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Alert, Spin } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import ibimaLogo from '../../assets/images/ibimaLogo.svg';
import { api } from '../../api/client';
import { COLORS } from '../../constants/theme';
import { formatDateTime } from '../../utils/format';

/**
 * Public page opened from a Password Reset "Send Link" link
 * (/reset-password?token=...). Checks the one-time token, then lets the
 * user set a new password.
 */
const ResetPasswordPage = () => {
    const [params] = useSearchParams();
    const token = params.get('token') ?? '';
    const [state, setState] = useState({ status: 'checking' }); // checking | ready | invalid | done
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setState({ status: 'invalid', message: 'This reset link is incomplete. Open the full link you were sent.' });
            return;
        }
        api.get(`/password-reset/${encodeURIComponent(token)}`, { auth: false })
            .then((info) => setState({ status: 'ready', info }))
            .catch((err) => setState({ status: 'invalid', message: err.message }));
    }, [token]);

    const submit = async ({ password }) => {
        setSaving(true);
        setError('');
        try {
            await api.post('/password-reset/confirm', { token, password }, { auth: false });
            setState((s) => ({ ...s, status: 'done' }));
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: COLORS.bgSoftBlue }}>
            <div className="w-full max-w-[420px] rounded-lg bg-white p-6" style={{ border: `1px solid ${COLORS.border}` }}>
                <img src={ibimaLogo} alt="IBima Assist" style={{ height: 48 }} className="mb-4" />
                <h1 className="text-xl font-bold m-0" style={{ color: COLORS.headingBlue }}>Set a new password</h1>

                {state.status === 'checking' && <div className="py-10 flex justify-center"><Spin /></div>}

                {state.status === 'invalid' && <Alert className="mt-4" type="error" showIcon title={state.message} />}

                {state.status === 'ready' && (
                    <>
                        <p className="text-[13px] mt-1 mb-4" style={{ color: COLORS.textSecondary }}>
                            For <b>{state.info.name}</b> ({state.info.userId}). This link expires on {formatDateTime(state.info.expiresAt)}.
                        </p>
                        <Form layout="vertical" requiredMark={false} onFinish={submit}>
                            <Form.Item name="password" label="New Password" rules={[{ required: true, message: 'Enter a new password' }, { min: 8, message: 'Minimum 8 characters' }, { pattern: /(?=.*\d)(?=.*[A-Za-z])/, message: 'Use letters and numbers' }]}>
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                            <Form.Item
                                name="confirm"
                                label="Confirm Password"
                                dependencies={['password']}
                                rules={[{ required: true, message: 'Confirm the password' }, ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))) })]}
                            >
                                <Input.Password autoComplete="new-password" />
                            </Form.Item>
                            {error && <Alert className="mb-3" type="error" showIcon title={error} />}
                            <Button type="primary" htmlType="submit" block loading={saving}>Save Password</Button>
                        </Form>
                    </>
                )}

                {state.status === 'done' && (
                    <div className="text-center py-6">
                        <CheckCircleFilled style={{ color: COLORS.success, fontSize: 40 }} />
                        <p className="text-[14px] font-semibold mt-3 mb-1">Password updated</p>
                        <p className="text-[13px] m-0" style={{ color: COLORS.textSecondary }}>You can now sign in to your IBima Assist app with the new password.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
