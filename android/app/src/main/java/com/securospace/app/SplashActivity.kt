package com.securospace.app

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.animation.AnimationUtils
import androidx.appcompat.app.AppCompatActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.securospace.app.databinding.ActivitySplashBinding

/**
 * SecuroSpace SplashActivity
 * Branded entry point with animated logo, transitions to MainActivity.
 */
class SplashActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySplashBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        // Handle the splash screen transition (API 31+)
        val splashScreen = installSplashScreen()
        super.onCreate(savedInstanceState)

        binding = ActivitySplashBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Full screen immersive
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.statusBars() or WindowInsetsCompat.Type.navigationBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE

        // Start logo animations
        startAnimations()

        // Navigate to main after delay
        Handler(Looper.getMainLooper()).postDelayed({
            navigateToMain()
        }, 2200)
    }

    private fun startAnimations() {
        val fadeIn = AnimationUtils.loadAnimation(this, android.R.anim.fade_in)
        fadeIn.duration = 800

        binding.splashLogo.startAnimation(fadeIn)
        binding.splashTitle.startAnimation(fadeIn)
        binding.splashTagline.startAnimation(fadeIn)

        // Pulse animation on the shield icon
        binding.splashLogo.animate()
            .scaleX(1.05f)
            .scaleY(1.05f)
            .setDuration(1000)
            .setStartDelay(600)
            .withEndAction {
                binding.splashLogo.animate()
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .setDuration(400)
                    .start()
            }
            .start()
    }

    private fun navigateToMain() {
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish()
    }
}
