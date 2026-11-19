//! Time shim (added by TulpaTutor's wasm patch). On wasm32-unknown-unknown `std::time` and
//! `std::thread::sleep` panic, so the browser host supplies a millisecond clock instead.
//! On every other target this module is a plain re-export of `std`.

#[cfg(not(target_arch = "wasm32"))]
pub use std::thread::sleep;
#[cfg(not(target_arch = "wasm32"))]
pub use std::time::{Instant, SystemTime, UNIX_EPOCH};

#[cfg(target_arch = "wasm32")]
mod imp {
    use std::ops::{Add, Sub};
    use std::time::Duration;

    #[link(wasm_import_module = "env")]
    extern "C" {
        /// Monotonic milliseconds (performance.now()).
        fn tt_now_ms() -> f64;
        /// Wall-clock milliseconds since the Unix epoch (Date.now()).
        fn tt_wall_ms() -> f64;
        /// Blocks the worker thread for `ms` milliseconds.
        fn tt_sleep_ms(ms: f64);
    }

    fn mono() -> f64 {
        unsafe { tt_now_ms() }
    }

    #[derive(Clone, Copy, Debug, PartialEq, PartialOrd)]
    pub struct Instant(f64);

    impl Instant {
        pub fn now() -> Instant {
            Instant(mono())
        }
        pub fn elapsed(&self) -> Duration {
            Instant::now().saturating_duration_since(*self)
        }
        pub fn duration_since(&self, earlier: Instant) -> Duration {
            self.saturating_duration_since(earlier)
        }
        pub fn saturating_duration_since(&self, earlier: Instant) -> Duration {
            Duration::from_secs_f64(((self.0 - earlier.0) / 1000.0).max(0.0))
        }
        pub fn checked_duration_since(&self, earlier: Instant) -> Option<Duration> {
            (self.0 >= earlier.0).then(|| self.saturating_duration_since(earlier))
        }
        pub fn checked_add(&self, d: Duration) -> Option<Instant> {
            Some(*self + d)
        }
    }
    impl Add<Duration> for Instant {
        type Output = Instant;
        fn add(self, d: Duration) -> Instant {
            Instant(self.0 + d.as_secs_f64() * 1000.0)
        }
    }
    impl Sub<Duration> for Instant {
        type Output = Instant;
        fn sub(self, d: Duration) -> Instant {
            Instant(self.0 - d.as_secs_f64() * 1000.0)
        }
    }
    impl Sub<Instant> for Instant {
        type Output = Duration;
        fn sub(self, o: Instant) -> Duration {
            self.saturating_duration_since(o)
        }
    }

    #[derive(Clone, Copy, Debug, PartialEq, PartialOrd)]
    pub struct SystemTime(f64);
    pub const UNIX_EPOCH: SystemTime = SystemTime(0.0);

    #[derive(Debug)]
    pub struct SystemTimeError;
    impl std::fmt::Display for SystemTimeError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            f.write_str("time went backwards")
        }
    }

    impl SystemTime {
        pub fn now() -> SystemTime {
            SystemTime(unsafe { tt_wall_ms() })
        }
        pub fn duration_since(&self, e: SystemTime) -> Result<Duration, SystemTimeError> {
            if self.0 >= e.0 {
                Ok(Duration::from_secs_f64((self.0 - e.0) / 1000.0))
            } else {
                Err(SystemTimeError)
            }
        }
        pub fn elapsed(&self) -> Result<Duration, SystemTimeError> {
            SystemTime::now().duration_since(*self)
        }
    }

    pub fn sleep(d: Duration) {
        unsafe { tt_sleep_ms(d.as_secs_f64() * 1000.0) }
    }
}

#[cfg(target_arch = "wasm32")]
pub use imp::{sleep, Instant, SystemTime, UNIX_EPOCH};
