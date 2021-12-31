let stopwordArr = getStopWords();

function getStopWords() {
    var stopwords = "guaranteed|100% garunteed|100 garunteed|video sax|mom tube|tube mom|six wap|sixwap|bp hindi|japanese tube|ponhub|100% guaranteed|100 guaranteed|100% Job Assistance|100 Job Assistance|Account no|Account number|Amount|Application fee|Arsehole|Ass|Ass fuck|Ass hole|Asshole|Attractive discounts|Auctus|Bastard|Bescumber|Bimbo|Bitch|Bomb blast|Boobs|Breast|Blow|Bullshit|Butt|By Industry Professionals|Certification Program|Certification Programme|Charges|Coccydynia|Cock|Cocksucker|Complimentary cover letter|Congratulations|Costs|Courses we offer|Criminal|Cunt|Dag|Degree Program|Degree Programme|Deposit cash|Deposit the cash|Detailed resume critique|Dick|Discount|Discover a bright future in ERP|Donkey|Dope|Dork|Early Bird Offer|Economy Pack|Electronic mail award promotion|Express Resume|Facial|Fart|FESTIVAL OFFER|For admission|For Enquiries|For Enquiries and Registration|For Registration|Freak|Free|Free Class|Free Demo|Free Demo Class|Free registration|Frenchify|Fuck|Fucking|Fucker|Fuckhole|Full Payment|Funds to an account|Gangbang|Garunteed placement|Gasbag|Get Certified|Get Trained|Get Trained Certified & Placed !|Goose|Guarantee|Guaranteed placement|Guaranty|High Paying|I luv You|Illegal|In favor of|In favour of|Interview knowhows|Jackpot lottery|Jerk|Job opportunities|LIC of India|Lick|Lottery|LOTTERY DRAW|Lotto|Loudmouth|Lucky winners|Microphallus|Mothafucka|Motherfucker|Murder|Murderer|New Batch|New Batches|NEW BATCHES STARTING|Nigerian local office|Nigga|Nigger|Nominated bank account|Nonsense|Nut|Offer letter|Opportunities!!!!!!!!!|Opportunity!!!|Paedophile|Participate as an investor|Partner naukri.com|Payment|Penis|Placement assistance|Porn|Premium Resume Development|Privately looking|Pussy|Pyt|Rape|Rapist|Redneck|Refugee camp|Refundable|Replacement Clause|Resume Critique|Resume Development|Resume Flash|Scam|Scholarship|Scum|Scumbag|Sex|Shit|Sicko|Skill oriented course|Smartass|Start-Up Kit|Student visa|Suck|Through Industry Professionals|Tight ass|Tits|Training Cum Placement|Turd|Twat|Twerp|Twit|Urgent Attention|Valid till|Value Pack|We charge|Will of god|Winning|Wish to invite|Wog|Wop|WORLDWIDE OPPORTUNITIES|Yid|Yob|You are a winner|sexual harassment|terror|terrorist|anus|assclown|asses|ass-hole|assbanger|assbite|asshead|asswipe|boob|bar girl|bar girls|bitchy|bisexual|sexual|blowjob|blowjobs|bollocks|call girl|call girls|cunnilingus|cuntface|cuntass|cum|dickbag|dickfuck|dickfucker|dickhead|dickjuice|dickweed|dumass|fag|faggot|female escort|fellatio|fuckbutt|fuckhead|fuckup|gay|gayass|gayfuck|gringo|guido|gooch|handjob|homo|hump|homosexual|homo|hot mms|humping|hell|hoe|ho|jackass|jagoff|jap|jizz|jerkoff|kyke|kraut|kunt|lesbian|lesbo|lezzie|muthafucka|male escort|motherfucking|nude|nude jobs|nude girl|nude girls|nude party girls|nude party girl|negro|nutsack|paki|pecker|party girls|party girl|piss|poontang|pedophile|pedo|prostitute|puta|queef|queer|schlong|shitass|shitbrains|shitter|shitting|suckass|titfuck|titty|titties|twat|vag|vagina|vajayjay|wank|whore|whorebag|whoreface|whores|xxx|xxxgirls|xxx girls|gigolo|prostitution|terrorism|sexy|nude boy|nude boys|nude party boys|bf indian|six video|sax video|nude party boy|premium|cheat|job|xxxxx|red wap|indian bf|gujarati bp|radwap|hindi bp|video six|redwap|indian sax|reftube|bedwap|jav hd|nx video|pon video|oriya bp|malayalamsax|bengali bp|xxc|rad wap|hindi sax|xivideo|hindi mms|saxvideo|tamilsax|indian mms|tamil sax|marathi bp|momtube|red wep|english bp|mom sax|animal sax|pon hub|x hubs|hotwap|indiansax|malayalam sax|nxvideo|hd pon|tamilsix|bengali video|pontube|red wap.com|pon hd|xivideos|hindisax|odia bp|kolkata bf|bed wap|momsax|india bf|bedwep|village bf|rectube|xxxcxx|jav.me|xxxxxxnx|muslim bf|sax com|fsiblog|esx video|animalsax|sixvideo|call boy|badawap|drp av|jav me|japanese av|japanesetube|india sax|smart value|dabwap|state street hyderabad|japanese mom|9x video|redwep|dvd wap|b[*]+\.com|tamil play|tamilplay|dvdwap|teluguwap|gujarati|tamilmv|yahoo cricket|playtamil|x video|bf india|Xnxx|xxxxxxx|xxxcxx|xxxxxxxxxxxxxxxxxxx|xxxxxw|cxxxx|xmom|mom hot|mom san|mom sec|mom and san|indian sax|punjabi sax|telugusax|kannada sax|malayalam sax|india sax|marathi sax|saxbp|telugu sax|saxmalayalam|tamil sax|bp sax|sax bp|saxfilm|englishsax|saxhindi|japan sax|saxmom|sax malayalam|marathisax|bd sax|indian.sax|kerala sax|gujratisax|schoolsax|sax film|marathi six|tamilsix|kannada six|six bp|hindi six|hindisix|kannadasix|telugusix|bp six|mom six|malayalamsix|punjabi six|telugu six|six kannada|kannada.six|six tamil|kolkata bf|bangalore bf|bf bdo|bharti bf|kolkata ki bf|kolkata ka bf|bf india|hotwap|masswap|hindiwap|six wap|menwap|wapin|kannada wap|badawap|barwap|teluguwap|dabwap|likewap|tamil wap|maswap|wap.in|telugu wap|sapwap|baswap|wapdam|tubewap|saxwap|wap in|bedwep|tamil mv|tamil six|saxtamil|tamil mv.in|tamil.mv|cool tamil|play tamil|sax tamil|cooltamil|tamilvilla|tamil wood|tamilwood|tamil mv.com|reftube|x{3,}";
    return stopwords.split("|");
}

function replaceAll(txt, replace, with_this) {
    return txt.replace(new RegExp(replace, 'gi'), with_this);
}


module.exports = function getStaticUrl(kw, loc = "", domain = "") {

    var spcl_Char_Arr = {
        "+": " plus ",
        "#": " sharp ",
        ".": " dot ",
        "-": " ",
        '"': " ",
        "'": " ",
        "&": " ",
        "/": " "
    };



    if (kw && kw != "") {
        kw = kw.toLowerCase();
        kw = kw.replace(/\s{2,}/i, " ");// preg_replace("/\s{2,}/i", " ", kw);
        kw = kw.replace(/\bjobs in\b/i, '');//preg_replace('/\bjobs in\b/i', "", kw);
        kw = kw.replace(/\bjobs\b/i, '');//preg_replace('/\bjobs\b/i', "", kw);
        kw = kw.replace(/\blimited\b/i, '');//preg_replace('/\blimited\b/i', "", kw);
        kw = kw.replace(/\bcorporation\b/i, '');//preg_replace('/\bcorporation\b/i', "", kw);
        kw = kw.replace(/\bcareers\b/i, '');//preg_replace('/\bcareers\b/i', "", kw);

        while (kw.indexOf("c++ c++") != -1) {
            kw = kw.replace("c++ c++", "c++")
        }

        // while (stristr(kw, "c++ c++") != false) {
        //     kw = preg_replace('/c\+\+ c\+\+/', "c++", kw);
        // }

        kw = kw.replace(/,/, " ");//preg_replace("/,/", " ", kw);

        kw = kw.replace(/[^.+#\-\'" a-zA-Z0-9]/i, ' '); //preg_replace('/[^.+#\-\'" a-zA-Z0-9]/i', ' ', kw);
        kw = kw.replace(/and {1,}$/, "");//preg_replace('/and {1,}$/', "", kw);

        kw = kw.trim();//trim(kw);


        for (var key in spcl_Char_Arr) {
            kw = kw.replace(new RegExp(('\\' + key), 'ig'), spcl_Char_Arr[key]);
        }
        // foreach ($Spcl_Char_Arr as $key => $val) {
        //     $pattern = '/\\' . $key . "/i";
        //     kw = preg_replace($pattern, $val, kw);
        // }

        kw = kw.replace(/\s{1,}/g, " ").trim();
        //kw = trim(preg_replace('/\s{1,}/', " ", kw));

        //todo:-
        // if (empty(kw)) {
        //     return false;
        // }

        var staticUrl = kw.replace(/\s/g, "-") + "-jobs";
        //staticUrl = str_replace(" ", "-", kw) . "-jobs";


        for (var e = 0; e < stopwordArr.length; e++) {
            kw = replaceAll(kw, "\\b" + stopwordArr[e].toLowerCase() + "\\b", "")
        }


        // $objStopWord = new StopWords();
        // $check = $objStopWord->checkStopwords(staticUrl);
        // if ($check) {
        //     return false;
        // }
    }

    if (loc && loc != "" && loc != "None") {
        if (kw == "") {
            staticUrl = "jobs";
        }

        loc = loc.split(' ');
        var urlLoc = "";

        for (var index = 0; index < loc.length; index++) {
            var location = loc[index];
            location = location.replace(/-+/, '-').replace(/\//, '-').replace(/[\s]/, '-').replace(/ & /, '-').replace(/[^, a-zA-Z]/, ' ').replace(/\s/g, "-").trim().toLowerCase();
            if (index > 0) {
                //urlLoc = urlLoc + "-and-" + location; 
                urlLoc = urlLoc + "-" + location;
            }
            else {
                urlLoc = location;
            }
        }

        // foreach (loc as $singleLoc) {
        //     loc[$i] = trim(loc[$i]);
        //     loc[$i] = strtolower(trim(preg_replace("/-+/", "-", preg_replace("/\//", "-", preg_replace("/[\s]/", "-", preg_replace("/ & /", "-", preg_replace("/[^, a-zA-Z]/", " ", loc[$i]))))), "-"));
        //     if (loc[$i] != "") {
        //         //fixed a missing brace here and balanced it where it should end.
        //         if ($i > 0) {
        //             urlLoc = urlLoc . "-and-" . loc[$i];
        //         } else {
        //             urlLoc = loc[$i];
        //         }
        //     }
        //     $i++;
        // }
        staticUrl = staticUrl + "-in-" + urlLoc;
    }
    //return domain . staticUrl;
    return staticUrl;
}