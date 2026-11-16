// 1. Connect to Vulpis Database
const SUPABASE_URL = "https://sbbchelaldkwsgeutxxg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_449WPgIWrOqh6i--LOVcfg_sMTe5vnh";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Grab the UI Elements
const loginBtn = document.getElementById('login-btn');
const userSection = document.getElementById('user-section');
const saveAvatarBtn = document.getElementById('save-avatar-btn');
const skinColorInput = document.getElementById('skin-color');
const hatSelect = document.getElementById('hat-select');
const gamesContainer = document.getElementById('games-container');

let currentUser = null;

// 3. Check if user is logged in
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        userSection.innerHTML = `<span class="text-green-400 font-bold mr-4">Logged In</span> <button id="logout-btn" class="bg-red-500 px-4 py-2 rounded font-bold">Logout</button>`;
        
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await supabase.auth.signOut();
            location.reload();
        });
        
        loadAvatar();
    }
}

// 4. Handle Login / Sign Up
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = prompt("Enter your email:");
        const password = prompt("Enter your password (min 6 characters):");
        
        if (!email || !password) return;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            const { error: signUpError } = await supabase.auth.signUp({ email, password });
            if (signUpError) alert("Error: " + signUpError.message);
            else {
                alert("Account created! You can now log in.");
                location.reload();
            }
        } else {
            location.reload();
        }
    });
}

// 5. Load and Save Avatar Data
async function loadAvatar() {
    if (!currentUser) return;
    const { data, error } = await supabase.from('avatars').select('cosmetics').eq('user_id', currentUser.id).single();
    
    if (data && data.cosmetics) {
        skinColorInput.value = data.cosmetics.skinColor || '#ffcc99';
        hatSelect.value = data.cosmetics.hatId || 'none';
    }
}

saveAvatarBtn.addEventListener('click', async () => {
    if (!currentUser) {
        alert("You must be logged in to save your avatar!");
        return;
    }
    
    const cosmetics = { skinColor: skinColorInput.value, hatId: hatSelect.value };

    const { error } = await supabase.from('avatars').upsert({
        user_id: currentUser.id,
        cosmetics: cosmetics
    });

    if (error) alert("Error saving avatar: " + error.message);
    else alert("Avatar saved successfully!");
});

// 6. Fetch Games for the Homepage
async function loadGames() {
    const { data: games, error } = await supabase.from('games').select('*');
    
    if (error || !games) {
        gamesContainer.innerHTML = `<p class="text-red-500">Failed to load games.</p>`;
        return;
    }

    if (games.length === 0) {
        gamesContainer.innerHTML = `<p class="text-gray-400">No games found. You need to upload one to the database!</p>`;
        return;
    }

    gamesContainer.innerHTML = games.map(game => `
        <a href="play.html?gameId=${game.id}" class="block bg-gray-700 p-4 rounded hover:bg-gray-600 transition">
            <h3 class="font-bold text-lg">${game.title}</h3>
            <p class="text-sm text-green-400 mt-2">▶ Play Now</p>
        </a>
    `).join('');
}

checkSession();
loadGames();