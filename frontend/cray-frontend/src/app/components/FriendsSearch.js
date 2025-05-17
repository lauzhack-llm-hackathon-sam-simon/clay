"use client";

import { useState, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { ListBox } from 'primereact/listbox';

export default function FriendsSearch({ onFriendSelect }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [friends, setFriends] = useState([]);
    const [filteredFriends, setFilteredFriends] = useState([]);

    useEffect(() => {
        // Fetch friends list from the backend
        fetch('/api/friends')
            .then(res => res.json())
            .then(data => {
                setFriends(data);
                setFilteredFriends(data);
            })
            .catch(err => console.error('Error fetching friends:', err));
    }, []);

    useEffect(() => {
        // Filter friends based on search term
        const filtered = friends.filter(friend => 
            friend.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFriends(filtered);
    }, [searchTerm, friends]);

    const handleFriendClick = (friend) => {
        if (onFriendSelect) {
            onFriendSelect(friend);
        }
    };

    return (
        <div className="friends-search">
            <div className="p-inputgroup mb-3">
                <span className="p-inputgroup-addon">
                    <i className="pi pi-search"></i>
                </span>
                <InputText
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search friends..."
                    className="w-full"
                />
            </div>
            <div className="friends-list" style={{ 
                maxHeight: '200px',
                overflowY: 'auto',
                borderRadius: '6px'
            }}>
                {filteredFriends.map((friend, index) => (
                    <div
                        key={index}
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                        onClick={() => handleFriendClick(friend)}
                    >
                        {friend}
                    </div>
                ))}
            </div>
        </div>
    );
} 