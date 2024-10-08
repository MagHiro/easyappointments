<?php defined('BASEPATH') or exit('No direct script access allowed');

/* ----------------------------------------------------------------------------
 * Easy!Appointments - Online Appointment Scheduler
 *
 * @package     EasyAppointments
 * @author      A.Tselegidis <alextselegidis@gmail.com>
 * @copyright   Copyright (c) Alex Tselegidis
 * @license     https://opensource.org/licenses/GPL-3.0 - GPLv3
 * @link        https://easyappointments.org
 * @since       v1.5.0
 * ---------------------------------------------------------------------------- */

/*
 * This file can only be used in a testing environment and only from the termninal.
 */

if (ENVIRONMENT !== 'testing' || !is_cli()) {
    show_404();
}

/**
 * Vtiger controller.
 *
 * This controller does not have or need any logic, it is just used so that CI can be loaded properly during the test
 * execution.
 */
class Vtiger extends EA_Controller
{
    /**
     * Placeholder callback.
     *
     * @return void
     */
    public function getChallenge($username)
    {
        $vtiger_url = Config::VTIGER_URL;
        $vtiger_username = Config::VTIGER_USERNAME;

        $url = $vtiger_url . '/webservice.php?operation=getchallenge&username=' . $vtiger_username;

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);
        if (curl_errno($ch)) {
            error_log('Curl error: ' . curl_error($ch));
            curl_close($ch);
            return null;
        }

        curl_close($ch);
        return json_decode($response, true);
    }

    public function auth()
    {
        $challenge = getChallenge(Config::VTIGER_USERNAME);
        if ($challenge && isset($challenge['result']['token'])) {
            $token = $challenge['result']['token'];
            $accessKey = md5($token . Config::VTIGER_ACCESSKEY);

            $data = http_build_query([
                'operation' => 'login',
                'username' => 'webhook',
                'accessKey' => $accessKey,
            ]);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, Config::VTIGER_URL . '/webservice.php');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

            $response = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($response, true);
            if ($result['success'] === true) {
                return $result['result']['sessionName'];
            }
        }
        return null;
    }

    public function getContactID($email)
    {
        $sessionName = auth();
        if (!$sessionName) {
            return null;
        }

        $url =
            Config::VTIGER_URL .
            '/webservice.php?operation=query&sessionName=' .
            $sessionName .
            '&query=' .
            urlencode("SELECT * FROM Contacts WHERE email = '$email';");

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['result']) && count($result['result']) > 0) {
            if (count($result['result']) > 1) {
                return ['success' => 'tldr', 'data' => $result['result']];
            }
            return ['success' => true, 'data' => $result['result'][0]];
        }
        return ['success' => false, 'data' => 'Nothing'];
    }

    public function createContact($formData)
    {
        $sessionName = auth();
        if (!$sessionName) {
            return null;
        }

        $contactData = [
            'firstname' => $formData['firstName'],
            'lastname' => $formData['lastName'],
            'phone' => $formData['phone'],
            'email' => $formData['email'],
            'cf_856' => $formData['group'],
            'cf_1611' => $formData['agency'],
            'assigned_user_id' => $formData['assigned_user_id'],
        ];

        $data = http_build_query([
            'operation' => 'create',
            'sessionName' => $sessionName,
            'element' => json_encode($contactData),
            'elementType' => 'Contacts',
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, Config::VTIGER_URL . '/webservice.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function updateContact($formData)
    {
        $sessionName = auth();
        if (!$sessionName) {
            return null;
        }

        $contactInfo = getContactID($formData['email']);
        if ($contactInfo['success'] === false) {
            return createContact($formData);
        }

        $updatedData = [
            'id' => $contactInfo['data']['id'],
            'firstname' => $formData['firstName'],
            'lastname' => $formData['lastName'],
            'phone' => $formData['phone'],
            'email' => $formData['email'],
            'cf_856' => $formData['group'],
            'cf_1611' => $formData['agency'],
            'assigned_user_id' => $contactInfo['data']['assigned_user_id'],
        ];

        $data = http_build_query([
            'operation' => 'update',
            'sessionName' => $sessionName,
            'element' => json_encode($updatedData),
        ]);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, Config::VTIGER_URL . '/webservice.php');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

        $response = curl_exec($ch);
        curl_close($ch);

        return json_decode($response, true);
    }

    public function vtigerController($formData, $operation)
    {
        if ($operation == 'create') {
            return createContact($formData);
        } else {
            return updateContact($formData);
        }
    }

    public function checkAvailability($email): bool
    {
        $sessionName = auth();
        if (!$sessionName) {
            return null;
        }

        $url =
            Config::VTIGER_URL .
            '/webservice.php?operation=query&sessionName=' .
            $sessionName .
            '&query=' .
            urlencode("SELECT * FROM Contacts WHERE email = '$email';");

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['result']) && count($result['result']) > 0) {
            if (count($result['result']) > 1) {
                return ['success' => 'tldr', 'data' => $result['result']];
            }
            return ['success' => true, 'data' => $result['result'][0]];
        }
        return ['success' => false, 'data' => 'Nothing'];
    }
}
