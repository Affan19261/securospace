package com.securospace.app

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.*
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.securospace.app.databinding.ActivityMainBinding

/**
 * SecuroSpace MainActivity
 * Hosts the encrypted web vault inside a hardened WebView with biometric integration.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWindowDecor()
        setupWebView()
        checkBiometricAndLoad()
    }

    // ─────────────────────────────────────────────
    // Window & Status Bar Configuration
    // ─────────────────────────────────────────────

    private fun setupWindowDecor() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.parseColor("#0a0d1a")

        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.isAppearanceLightStatusBars = false
        controller.isAppearanceLightNavigationBars = false
    }

    // ─────────────────────────────────────────────
    // WebView Hardened Configuration
    // ─────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView = binding.webView

        webView.settings.apply {
            // JavaScript is required for Web Crypto API
            javaScriptEnabled = true

            // Allow DOM Storage (for localStorage-based encryption)
            domStorageEnabled = true

            // Load files from assets folder
            allowFileAccess = true
            allowContentAccess = true

            // Display settings
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false

            // Cache configuration
            cacheMode = WebSettings.LOAD_DEFAULT

            // Security - disable mixed content in production
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW

            // Enable modern web features
            mediaPlaybackRequiresUserGesture = false
        }

        // Handle page loading states
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Hide loading overlay once page is loaded
                binding.loadingOverlay.animate()
                    .alpha(0f)
                    .setDuration(400)
                    .withEndAction {
                        binding.loadingOverlay.visibility = View.GONE
                    }
                    .start()
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                Toast.makeText(
                    this@MainActivity,
                    "Error loading SecuroSpace: ${error?.description}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }

        // Chrome client for console logging and alert dialogs
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                // Mirror web console to Android logcat
                consoleMessage?.let {
                    android.util.Log.d("SecuroSpace-JS", "[${it.messageLevel()}] ${it.message()}")
                }
                return true
            }
        }
    }

    // ─────────────────────────────────────────────
    // Biometric Authentication
    // ─────────────────────────────────────────────

    private fun checkBiometricAndLoad() {
        val biometricManager = BiometricManager.from(this)

        val canAuthenticate = biometricManager.canAuthenticate(
            BIOMETRIC_STRONG or DEVICE_CREDENTIAL
        )

        if (canAuthenticate == BiometricManager.BIOMETRIC_SUCCESS) {
            showBiometricPrompt()
        } else {
            // No biometric available — load app directly
            loadSecuroSpace()
        }
    }

    private fun showBiometricPrompt() {
        val executor = ContextCompat.getMainExecutor(this)

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("SecuroSpace")
            .setSubtitle("Verify your identity to access the vault")
            .setDescription("Use biometric or device PIN to proceed")
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            .build()

        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    loadSecuroSpace()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    if (errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON ||
                        errorCode == BiometricPrompt.ERROR_USER_CANCELED
                    ) {
                        // User cancelled biometric — still load app (master password will guard vault)
                        loadSecuroSpace()
                    } else {
                        Toast.makeText(
                            this@MainActivity,
                            "Authentication error: $errString",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(
                        this@MainActivity,
                        "Biometric not recognized. Try again.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })

        biometricPrompt.authenticate(promptInfo)
    }

    // ─────────────────────────────────────────────
    // Load Web App from Assets
    // ─────────────────────────────────────────────

    private fun loadSecuroSpace() {
        // Load the bundled web app from assets/
        webView.loadUrl("file:///android_asset/index.html")
    }

    // ─────────────────────────────────────────────
    // Back Navigation Handling
    // ─────────────────────────────────────────────

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
